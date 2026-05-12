// Facilities — fetched from the admin-managed API. Each facility screen
// merges the fetched record with bundled fallbacks (require()'d images,
// hardcoded phone numbers) so the UI keeps working if the API is offline.

import { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../api';

const HOST = API_BASE_URL.replace(/\/api\/?$/, '');
export function toAbsolute(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return HOST + (url.startsWith('/') ? url : '/' + url);
}

let cache = null;
let inflight = null;

export async function loadFacilities({ force = false } = {}) {
  if (cache && !force) return cache;
  if (!inflight) {
    inflight = api.facilities()
      .then(rows => { cache = rows; inflight = null; return cache; })
      .catch(err => { inflight = null; throw err; });
  }
  return inflight;
}

export function useFacility(key) {
  const initial = cache ? cache.find(f => f.key === key) : null;
  const [facility, setFacility] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    if (cache) {
      setFacility(cache.find(f => f.key === key) || null);
      return;
    }
    loadFacilities()
      .then(rows => { if (!cancelled) setFacility(rows.find(f => f.key === key) || null); })
      .catch(() => { /* keep null, consumer falls back to hardcoded values */ });
    return () => { cancelled = true; };
  }, [key]);

  return facility;
}

export function facilityImages(facility) {
  if (!facility?.image_urls) return [];
  try {
    const urls = JSON.parse(facility.image_urls);
    return urls.map(u => ({ uri: toAbsolute(u) }));
  } catch {
    return [];
  }
}
