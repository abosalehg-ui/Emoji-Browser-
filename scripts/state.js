const listeners = new Map();
const data = {
  lang: 'ar',
  theme: 'light',
  skinTone: 'default',
  currentCategory: 'all',
  currentCollection: null,
  selectMode: false,
  selected: new Set(),
  emojis: [],
  emojisByChar: new Map(),
  filtered: [],
  favorites: [],
  recent: [],
  collections: [],
  stats: { counts: {}, firstSeen: {}, lastUsed: {} },
  categories: [],
  query: '',
  view: 'main',
};

export function get(key) {
  return data[key];
}

export function set(key, value) {
  data[key] = value;
  emit(key, value);
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

function emit(key, value) {
  const set = listeners.get(key);
  if (set) set.forEach((fn) => fn(value));
}
