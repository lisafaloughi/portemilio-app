export const colors = {
  bg: '#f8f6f1',
  surface: '#ffffff',
  text: '#333333',
  subtle: '#6b6b6b',
  muted: '#a0a0a0',
  accent: '#1e4d6b',
  accent2: '#c99b6e',
  border: '#ece7dd',
  success: '#2e7d4f',
  danger: '#b33a3a',
  overlay: 'rgba(0,0,0,0.28)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 10, lg: 14, xl: 20 };
export const font = {
  h1: { fontSize: 26, fontWeight: '700', color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  h3: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.subtle },
  tiny: { fontSize: 12, color: colors.muted },
};

// Deterministic pastel color for a placeholder based on a string
export function placeholderColor(key = '') {
  const palette = ['#1e4d6b', '#c99b6e', '#4a7c59', '#8e4162', '#a6703e', '#2d5f7d', '#5a6e4d', '#946c4f'];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 1000;
  return palette[h % palette.length];
}

export function placeholderIcon(category = '') {
  const map = {
    pool: 'pool', outdoor_pool: 'pool', indoor_pool: 'pool',
    wellness: 'spa-outline', spa: 'spa-outline', gym: 'dumbbell',
    hair_salon: 'content-cut', salon: 'content-cut',
    sports: 'tennis', tennis: 'tennis', shooting: 'target',
    family: 'human-male-female-child', kids: 'teddy-bear',
    beach: 'beach', outdoor: 'beach',
    services: 'bell-outline', concierge: 'bell-outline',
    italian: 'pasta', lebanese: 'food-variant', japanese: 'fish',
    snacks: 'glass-cocktail',
    water_sports: 'sail-boat', jetski: 'sail-boat', sup: 'surfing',
    kayak: 'kayaking', snorkel: 'swim',
    event: 'party-popper', jazz: 'saxophone',
    bbq: 'grill', wine: 'glass-wine',
  };
  const k = (category || '').toLowerCase();
  for (const key of Object.keys(map)) if (k.includes(key)) return map[key];
  return 'domain';
}
