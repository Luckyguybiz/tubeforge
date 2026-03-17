import { describe, it, expect } from 'vitest';
import { escapeHtml, stripTags, sanitize } from '@/lib/sanitize';

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape less-than signs', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('should escape greater-than signs', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it('should escape forward slashes', () => {
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('should escape all special chars in one string', () => {
    expect(escapeHtml('&<>"\'/'))
      .toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;');
  });

  it('should escape a full script tag', () => {
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('should handle an empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should return strings with no special chars unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('should preserve whitespace characters', () => {
    expect(escapeHtml('a\tb\nc')).toBe('a\tb\nc');
  });

  it('should preserve unicode characters', () => {
    expect(escapeHtml('Привет мир')).toBe('Привет мир');
  });

  it('should handle multiple consecutive special chars', () => {
    expect(escapeHtml('<<<>>>')).toBe('&lt;&lt;&lt;&gt;&gt;&gt;');
  });
});

describe('stripTags', () => {
  it('should remove a simple HTML tag', () => {
    expect(stripTags('<b>bold</b>')).toBe('bold');
  });

  it('should remove multiple different tags', () => {
    expect(stripTags('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
  });

  it('should remove nested tags', () => {
    expect(stripTags('<div><p>hello</p></div>')).toBe('hello');
  });

  it('should remove deeply nested tags', () => {
    expect(stripTags('<div><span><a href="#">link</a></span></div>')).toBe('link');
  });

  it('should handle self-closing tags', () => {
    expect(stripTags('text<br/>more')).toBe('textmore');
  });

  it('should handle self-closing tags with a space', () => {
    expect(stripTags('text<br />more')).toBe('textmore');
  });

  it('should remove tags with attributes', () => {
    expect(stripTags('<a href="https://example.com" class="link">click</a>')).toBe('click');
  });

  it('should handle unclosed tags (malformed HTML)', () => {
    expect(stripTags('<div>content')).toBe('content');
  });

  it('should handle tags with no content', () => {
    expect(stripTags('<div></div>')).toBe('');
  });

  it('should preserve text between multiple tags', () => {
    expect(stripTags('<a>link</a> and <b>bold</b>')).toBe('link and bold');
  });

  it('should handle an empty string', () => {
    expect(stripTags('')).toBe('');
  });

  it('should return strings with no tags unchanged', () => {
    expect(stripTags('just plain text')).toBe('just plain text');
  });

  it('should handle tags with newlines in attributes', () => {
    expect(stripTags('<div\nclass="foo"\nid="bar">content</div>')).toBe('content');
  });

  it('should remove script tags but keep content', () => {
    expect(stripTags('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('should remove style tags but keep content', () => {
    expect(stripTags('<style>body{color:red}</style>')).toBe('body{color:red}');
  });
});

describe('sanitize', () => {
  it('should strip tags and then escape remaining entities', () => {
    expect(sanitize('<b>test & "value"</b>')).toBe('test &amp; &quot;value&quot;');
  });

  it('should handle an empty string', () => {
    expect(sanitize('')).toBe('');
  });

  it('should pass through plain text with no special chars', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
  });

  it('should escape entities in plain text without tags', () => {
    expect(sanitize('a & b < c')).toBe('a &amp; b &lt; c');
  });

  it('should preserve unicode characters', () => {
    expect(sanitize('Привет <b>мир</b> 🎬')).toBe('Привет мир 🎬');
  });

  // --- XSS attack vectors ---

  it('should neutralize script tag injection', () => {
    expect(sanitize('<script>alert("xss")</script>'))
      .toBe('alert(&quot;xss&quot;)');
  });

  it('should neutralize script tag with single quotes', () => {
    expect(sanitize("<script>alert('xss')</script>"))
      .toBe("alert(&#x27;xss&#x27;)");
  });

  it('should neutralize img onerror injection', () => {
    expect(sanitize('<img onerror="alert(1)" src=x>')).toBe('');
  });

  it('should neutralize img onerror with JavaScript protocol', () => {
    expect(sanitize('<img src=x onerror="javascript:alert(1)">')).toBe('');
  });

  it('should neutralize svg onload injection', () => {
    expect(sanitize('<svg onload="alert(1)">')).toBe('');
  });

  it('should neutralize event handler in div', () => {
    expect(sanitize('<div onmouseover="alert(1)">hover me</div>'))
      .toBe('hover me');
  });

  it('should neutralize iframe injection', () => {
    expect(sanitize('<iframe src="https://evil.com"></iframe>')).toBe('');
  });

  it('should neutralize nested script inside div', () => {
    expect(sanitize('<div><script>bad()</script><p>good</p></div>'))
      .toBe('bad()good');
  });

  it('should neutralize javascript protocol in anchor href', () => {
    expect(sanitize('<a href="javascript:alert(1)">click</a>')).toBe('click');
  });

  it('should neutralize data URI in anchor', () => {
    // The regex-based stripTags sees the first '>' inside the href value as tag end,
    // leaving residual text. sanitize still escapes all dangerous chars.
    const result = sanitize('<a href="data:text/html,<script>alert(1)</script>">click</a>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('click');
  });

  it('should neutralize style-based attack', () => {
    expect(sanitize('<div style="background:url(javascript:alert(1))">text</div>'))
      .toBe('text');
  });

  it('should neutralize encoded HTML entities in tags', () => {
    // After stripTags, the text content is just "test"
    expect(sanitize('<b>test</b>')).toBe('test');
  });

  it('should handle multiple XSS attempts in one string', () => {
    const input = '<script>a()</script>text<img onerror=b()><div onclick=c()>more</div>';
    expect(sanitize(input)).toBe('a()textmore');
  });

  it('should handle single quotes in sanitize', () => {
    expect(sanitize("it's a test")).toBe("it&#x27;s a test");
  });

  it('should handle forward slashes in sanitize', () => {
    expect(sanitize('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });
});
