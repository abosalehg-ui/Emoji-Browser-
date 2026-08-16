import { describe, it, expect } from 'vitest';
import {
  searchEmojis,
  filterByCategory,
  buildIndex,
  prepareSearch,
  normalizeAr,
} from '../scripts/search.js';

const sample = [
  {
    emoji: '😀',
    category: 'smileys',
    arName: 'وجه مبتسم',
    enName: 'Grinning Face',
    keywords: ['happy', 'smile'],
  },
  {
    emoji: '🐶',
    category: 'animals',
    arName: 'كلب',
    enName: 'Dog',
    keywords: ['pet'],
  },
  {
    emoji: '🏆',
    category: 'activities',
    arName: 'كأس',
    enName: 'Trophy',
    desc: 'كرة قدم أمريكية',
    keywords: ['ألعاب'],
  },
];

describe('searchEmojis', () => {
  it('returns all when query is empty', () => {
    expect(searchEmojis(sample, '')).toHaveLength(sample.length);
  });

  it('matches English name case-insensitively', () => {
    expect(searchEmojis(sample, 'DOG')).toEqual([sample[1]]);
  });

  it('matches Arabic name', () => {
    expect(searchEmojis(sample, 'مبتسم')).toEqual([sample[0]]);
  });

  it('matches keywords', () => {
    expect(searchEmojis(sample, 'pet')).toEqual([sample[1]]);
  });

  it('returns empty array on no match', () => {
    expect(searchEmojis(sample, 'zzz')).toEqual([]);
  });

  // 582 of the 1358 Arabic names carry a hamza seat, ta marbuta, or alef
  // maqsura that users routinely omit when typing.
  it('matches Arabic names typed without the hamza seat', () => {
    expect(searchEmojis(sample, 'كاس')).toEqual([sample[2]]);
  });

  it('matches keywords typed without the hamza seat', () => {
    expect(searchEmojis(sample, 'العاب')).toEqual([sample[2]]);
  });

  it('matches across ta marbuta and alef maqsura', () => {
    expect(searchEmojis(sample, 'كره قدم')).toEqual([sample[2]]);
  });

  it('still matches when the query is spelled exactly as stored', () => {
    expect(searchEmojis(sample, 'كأس')).toEqual([sample[2]]);
  });
});

describe('normalizeAr', () => {
  it('folds hamza seats onto a bare alef', () => {
    expect(normalizeAr('أإآٱ')).toBe('اااا');
  });

  it('folds ta marbuta and alef maqsura', () => {
    expect(normalizeAr('كرة')).toBe('كره');
    expect(normalizeAr('مصطفى')).toBe('مصطفي');
  });

  it('strips tashkeel and tatweel', () => {
    expect(normalizeAr('كِتَاب')).toBe('كتاب');
    expect(normalizeAr('كــتاب')).toBe('كتاب');
  });

  it('lowercases latin text alongside', () => {
    expect(normalizeAr('DOG')).toBe('dog');
  });
});

describe('filterByCategory', () => {
  it('returns all for "all" or falsy', () => {
    expect(filterByCategory(sample, 'all')).toHaveLength(sample.length);
    expect(filterByCategory(sample, null)).toHaveLength(sample.length);
  });

  it('filters by category id', () => {
    expect(filterByCategory(sample, 'animals')).toEqual([sample[1]]);
  });
});

describe('buildIndex', () => {
  it('maps emoji char to object', () => {
    const idx = buildIndex(sample);
    expect(idx.get('🐶')).toBe(sample[1]);
    expect(idx.size).toBe(sample.length);
  });
});

describe('prepareSearch', () => {
  it('attaches a lowercase _search haystack', () => {
    const [a] = prepareSearch([{ ...sample[0] }]);
    expect(a._search).toContain('grinning face');
    expect(a._search).toContain('وجه مبتسم');
  });
});
