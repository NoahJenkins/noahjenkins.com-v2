import { encodePathSegment, escapeXml, toSafeJsonLd } from '../../lib/security'

describe('security utilities', () => {
  it('encodes URL path segments safely', () => {
    expect(encodePathSegment('hello world')).toBe('hello%20world')
    expect(encodePathSegment('../post?<script>')).toBe('..%2Fpost%3F%3Cscript%3E')
  })

  it('escapes XML reserved characters', () => {
    expect(escapeXml(`<tag attr="x">Tom & Jerry's</tag>`)).toBe(
      '&lt;tag attr=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/tag&gt;'
    )
  })

  it('serializes JSON-LD safely for script tag injection context', () => {
    const serialized = toSafeJsonLd({
      headline: '</script><script>alert(1)</script>',
      body: 'safe & sound',
    })

    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003c/script\\u003e')
    expect(serialized).toContain('\\u0026')
  })
})
