// Other Services (Front Desk, Heritage, Marina, etc) — fetched from the API
// so admins can edit name/description/images/phone/hours/location from the
// portal and the app reflects the changes.
//
// Each consumer screen calls useService(key) and merges the returned record
// with its own fallbacks (hardcoded constants, bundled require()'d images,
// phone numbers, etc) so the app keeps working even if the API is offline.

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

export async function loadServices({ force = false } = {}) {
  if (cache && !force) return cache;
  if (!inflight) {
    inflight = api.services()
      .then(rows => { cache = rows; inflight = null; return cache; })
      .catch(err => { inflight = null; throw err; });
  }
  return inflight;
}

export function useService(key) {
  const initial = cache ? cache.find(s => s.key === key) : null;
  const [service, setService] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    if (cache) {
      setService(cache.find(s => s.key === key) || null);
      return;
    }
    loadServices()
      .then(rows => { if (!cancelled) setService(rows.find(s => s.key === key) || null); })
      .catch(() => { /* keep null; consumer falls back to hardcoded values */ });
    return () => { cancelled = true; };
  }, [key]);

  return service;
}

// Helper: extract image URIs from the service record's image_urls JSON.
// Returns an array of { uri } objects (or [] if none).
export function serviceImages(service) {
  if (!service?.image_urls) return [];
  try {
    const urls = JSON.parse(service.image_urls);
    return urls.map(u => ({ uri: toAbsolute(u) }));
  } catch {
    return [];
  }
}
