import { renderToStaticMarkup } from 'react-dom/server'


jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ components }: any) => {
    // Mimic react-markdown: every component receives the hast `node` prop.
    const node = { type: 'element' }
    const { a: A, li: LI, ul: UL, code: Code } = components
    return (
      <UL node={node}>
        <LI node={node}>item</LI>
        <A node={node} href="https://example.com">link</A>
        <Code node={node}>{'const a = 1'}</Code>
      </UL>
    )
  },
}))
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }))
jest.mock('sanitize-html', () => ({ __esModule: true, default: (html: string) => html }))
jest.mock('sugar-high', () => ({ highlight: (code: string) => code }))

import { CustomMDX } from '../../components/mdx'

describe('CustomMDX', () => {
  it('does not leak the react-markdown node prop into the DOM', () => {
    const html = renderToStaticMarkup(<CustomMDX source="x" />)
    expect(html).not.toContain('node=')
    expect(html).not.toContain('[object Object]')
    expect(html).toContain('<li')
  })
})
