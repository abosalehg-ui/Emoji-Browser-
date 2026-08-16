import { describe, it, expect } from 'vitest';
import {
  toBase64Url,
  fromBase64Url,
  htmlEntity,
  emojiToUnicode,
  escapeHtml,
} from '../scripts/utils.js';

describe('base64url round-trip', () => {
  it('encodes and decodes unicode strings losslessly', () => {
    const input = JSON.stringify({ n: 'مجموعة 😀', e: ['❤️', '🐶'] });
    expect(fromBase64Url(toBase64Url(input))).toBe(input);
  });

  it('produces url-safe output (no +, /, =)', () => {
    const out = toBase64Url('???>>>???');
    expect(out).not.toMatch(/[+/=]/);
  });
});

describe('htmlEntity', () => {
  it('converts a U+ code to a hex HTML entity', () => {
    expect(htmlEntity('U+1F60A')).toBe('&#x1F60A;');
  });

  // 319 of the 1358 records carry a space-separated sequence; emitting one
  // entity for the whole string produced invalid HTML for all of them.
  it('emits one entity per code point in a sequence', () => {
    expect(htmlEntity('U+2764 U+FE0F')).toBe('&#x2764;&#xFE0F;');
    expect(htmlEntity('U+1F3F4 U+E0067 U+E007F')).toBe('&#x1F3F4;&#xE0067;&#xE007F;');
  });

  it('tolerates padding and empty input', () => {
    expect(htmlEntity('  U+2764   U+FE0F  ')).toBe('&#x2764;&#xFE0F;');
    expect(htmlEntity('')).toBe('');
  });
});

describe('emojiToUnicode', () => {
  it('maps a single-codepoint emoji', () => {
    expect(emojiToUnicode('😀')).toBe('U+1F600');
  });

  it('joins multi-codepoint sequences', () => {
    expect(emojiToUnicode('❤️')).toBe('U+2764 U+FE0F');
  });
});

describe('escapeHtml', () => {
  it('neutralizes HTML metacharacters', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
    expect(escapeHtml(`"&'`)).toBe('&quot;&amp;&#39;');
  });
});
