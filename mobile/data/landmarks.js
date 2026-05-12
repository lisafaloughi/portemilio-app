// Landmarks — fetched from the admin-managed API, with bundled image
// fallbacks keyed by landmark key (so locally-known landmarks keep showing
// nice photos even before the API responds or if it's unreachable).

import { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../api';

const HOST = API_BASE_URL.replace(/\/api\/?$/, '');
function toAbsolute(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return HOST + (url.startsWith('/') ? url : '/' + url);
}

const PLACEHOLDER = require('../assets/jounieh-guide.jpg');

// Local fallback images by landmark key — these match the seed values, so
// the UI looks correct even before the API responds.
const LOCAL_IMAGES = {
  'jeita-grotto': require('../assets/guide/jeita_grotto.jpg'),
  'casino-du-liban': require('../assets/guide/casino_du_liban.jpg'),
  'jounieh-district': require('../assets/guide/jounieh.jpg'),
  'harissa': require('../assets/guide/harissa.jpg'),
  'beirut-downtown': require('../assets/guide/beirut_downtown.jpg'),
  'byblos': require('../assets/guide/byblos.jpg'),
  'st-charbel': require('../assets/guide/st_charbel.jpg'),
  'mzaar-ski': require('../assets/guide/mzaar-ski.jpg'),
  'batroun': require('../assets/guide/batroun.jpg'),
  'saida': require('../assets/guide/saida.jpg'),
  'tripoli': require('../assets/guide/tripoli.jpg'),
  'baalbeck': require('../assets/guide/baalbeck.jpg'),
  'pharmacies': require('../assets/guide/pharmacies.jpg'),
  'hospitals': require('../assets/guide/hospitals.jpg'),
};

let cache = null;
let inflight = null;

function normalize(row) {
  // Map DB types to the UI types the screens already use
  const uiType = row.type === 'relevant_services' ? 'relevant-services' : 'sightseeing';

  // Image priority: admin-uploaded image_urls → bundled local image → placeholder
  let image = LOCAL_IMAGES[row.key] || PLACEHOLDER;
  let imagesArr = null;
  if (row.image_urls) {
    try {
      const urls = JSON.parse(row.image_urls);
      if (urls.length) {
        imagesArr = urls.map(u => ({ uri: toAbsolute(u) }));
        image = imagesArr[0];
      }
    } catch (_) { /* keep local */ }
  }

  // Render the locations sublist into the `bullets` array the existing UI uses.
  const bullets = [];
  if (uiType === 'sightseeing' && row.distance) bullets.push(`${row.distance} from the hotel`);
  if (Array.isArray(row.locations)) {
    for (const loc of row.locations) {
      const parts = [loc.name];
      if (loc.address) parts.push(loc.address);
      if (loc.phone) parts.push(loc.phone);
      bullets.push(parts.join(' · '));
    }
  }

  return {
    id: row.key,
    db_id: row.id,
    type: uiType,
    name: row.name,
    subtitle: row.subtitle || '',
    distance: row.distance || '',
    image,
    images: imagesArr,
    description: row.description || '',
    bullets,
    address: row.address || null,
    phone: row.phone || null,
    website: row.website || null,
    locations: row.locations || [],
  };
}

export async function loadLandmarks({ force = false } = {}) {
  if (cache && !force) return cache;
  if (!inflight) {
    inflight = api.landmarks()
      .then(rows => { cache = rows.map(normalize); inflight = null; return cache; })
      .catch(err => { inflight = null; throw err; });
  }
  return inflight;
}

export function useLandmarks() {
  const [items, setItems] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    if (cache) { setLoading(false); return; }
    loadLandmarks()
      .then(d => { if (!cancelled) { setItems(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}

// Synchronous lookup (cache only). Returns null if not yet loaded.
export function landmarkById(id) {
  if (!cache) return null;
  return cache.find(l => l.id === id) || null;
}

// Hook variant for the detail screen — will fetch if cache is empty.
export function useLandmark(id) {
  const initial = cache ? cache.find(l => l.id === id) : null;
  const [landmark, setLandmark] = useState(initial);
  useEffect(() => {
    let cancelled = false;
    if (initial) return;
    loadLandmarks()
      .then(d => { if (!cancelled) setLandmark(d.find(l => l.id === id) || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);
  return landmark;
}

// Backward-compat: some places still import LANDMARKS as a static array.
// Start empty; consumers should prefer useLandmarks().
export const LANDMARKS = [];
