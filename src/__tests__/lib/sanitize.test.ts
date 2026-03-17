import { describe, it, expect } from 'vitest';
import { escapeHtml, stripTags, sanitize } from '@/lib/sanitize';

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('stripTags', () => {
    it('should remove HTML tags', () => {
      expect(stripTags('<b>bold</b> text')).toBe('bold text');
    });

    it('should handle nested tags', () => {
      expect(stripTags('<div><p>hello</p></div>')).toBe('hello');
    });
  });

  describe('sanitize', () => {
    it('should strip tags and escape entities', () => {
      expect(sanitize('<b>test & "value"</b>')).toBe('test &amp; &quot;value&quot;');
    });

    it('should handle script injection', () => {
      expect(sanitize('<script>alert("xss")</script>')).toBe('alert(&quot;xss&quot;)');
    });

    it('should handle event handler injection', () => {
      expect(sanitize('<img onerror="alert(1)" src=x>')).toBe('');
    });

    it('should handle nested malicious tags', () => {
      expect(sanitize('<div><script>bad()</script><p>good</p></div>')).toBe('bad()good');
    });

    it('should handle plain text without modification beyond escaping', () => {
      expect(sanitize('Hello World')).toBe('Hello World');
    });

    it('should preserve unicode characters', () => {
      expect(sanitize('Привет <b>мир</b> 🎬')).toBe('Привет мир 🎬');
    });

    it('should handle single quotes', () => {
      expect(sanitize("it's a test")).toBe("it&#x27;s a test");
    });
  });

  describe('escapeHtml edge cases', () => {
    it('should escape forward slashes', () => {
      expect(escapeHtml('a/b')).toBe('a&#x2F;b');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe("it&#x27;s");
    });

    it('should handle strings with only special characters', () => {
      expect(escapeHtml('<>&"\'/')).toBe('&lt;&gt;&amp;&quot;&#x27;&#x2F;');
    });
  });

  describe('stripTags edge cases', () => {
    it('should handle self-closing tags', () => {
      expect(stripTags('text<br/>more')).toBe('textmore');
    });

    it('should handle unclosed tags', () => {
      expect(stripTags('<div>content')).toBe('content');
    });

    it('should preserve text between multiple tags', () => {
      expect(stripTags('<a>link</a> and <b>bold</b>')).toBe('link and bold');
    });
  });
});
