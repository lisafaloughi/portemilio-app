// Venues are managed by the admin portal — this module fetches them from the API
// and merges in the local image bundle (images stay in the app to avoid network round-trips
// and so admin doesn't need to deal with uploads).

import { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../api';

// API_BASE_URL ends in /api — strip it for static asset URLs (/uploads/...)
const HOST = API_BASE_URL.replace(/\/api\/?$/, '');
function toAbsolute(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return HOST + (url.startsWith('/') ? url : '/' + url);
}

// Image bundle keyed by venue slug. Add a new entry here whenever the admin creates a venue
// that should display images in the app.
const VENUE_IMAGES = {
  'la-reserve': [
    require('../assets/restaurants/la_reserve.jpeg'),
    require('../assets/restaurants/lareserve1.png'),
    require('../assets/restaurants/lareserve2.png'),
  ],
  'pool-bar': [
    require('../assets/restaurants/poolbar1.jpg'),
    require('../assets/restaurants/poolbar2.jpg'),
  ],
  'la-terrasse': [
    require('../assets/restaurants/laterrasse1.jpg'),
    require('../assets/restaurants/laterrasse2.jpg'),
  ],
  'fellinis': [
    require('../assets/restaurants/felinis1.jpg'),
    require('../assets/restaurants/felinis2.jpg'),
    require('../assets/restaurants/felinis3.jpg'),
  ],
  'khuans-bar': [
    require('../assets/restaurants/khuans1.jpg'),
    require('../assets/restaurants/khuans2.jpg'),
    require('../assets/restaurants/khuans3.jpeg'),
    require('../assets/restaurants/khuans4.jpg'),
    require('../assets/restaurants/khuans5.png'),
  ],
  'sunset-bar': [
    require('../assets/restaurants/sunsetbar.jpg'),
  ],
};

let cache = null;
let inflight = null;

function normalize(row) {
  const slug = row.slug || `r-${row.id}`;

  // Prefer admin-uploaded images; fall back to locally bundled assets
  let images = VENUE_IMAGES[slug] || [];
  if (row.image_urls) {
    try {
      const urls = JSON.parse(row.image_urls);
      if (urls.length) images = urls.map(u => ({ uri: toAbsolute(u) }));
    } catch { /* keep local bundle */ }
  }

  let highlights = [];
  if (row.highlights) {
    try { highlights = JSON.parse(row.highlights); } catch { highlights = []; }
  }

  return {
    ...row,
    id: slug,
    db_id: row.id,
    image: images[0] || null,
    images,
    categories: (row.categories || '').split(',').map(s => s.trim()).filter(Boolean),
    highlights,
    upcoming: !!row.upcoming,
    mapPinId: row.map_pin_id || slug,
    menuUrl: row.menu_pdf_url ? toAbsolute(row.menu_pdf_url) : null,
  };
}

export async function loadVenues({ force = false } = {}) {
  if (cache && !force) return cache;
  if (!inflight) {
    inflight = api.restaurants()
      .then(rows => { cache = rows.map(normalize); inflight = null; return cache; })
      .catch(err => { inflight = null; throw err; });
  }
  return inflight;
}

export function useVenues() {
  const [venues, setVenues] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (cache) { setLoading(false); return; }
    loadVenues()
      .then(data => { if (!cancelled) { setVenues(data); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { venues, loading, error, reload: () => loadVenues({ force: true }).then(setVenues) };
}

export function useVenue(id) {
  const [venue, setVenue] = useState(cache ? cache.find(v => v.id === id) : null);
  const [loading, setLoading] = useState(!venue);
  useEffect(() => {
    let cancelled = false;
    if (cache) {
      setVenue(cache.find(v => v.id === id) || null);
      setLoading(false);
      return;
    }
    loadVenues()
      .then(data => { if (!cancelled) { setVenue(data.find(v => v.id === id) || null); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);
  return { venue, loading };
}

// Synchronous lookup (cache-only). Returns null if the cache hasn't been hydrated yet.
export function venueById(id) {
  if (!cache) return null;
  return cache.find(v => v.id === id) || null;
}

// Static fallback list — empty by default; consumers should prefer useVenues().
export const VENUES = [];
