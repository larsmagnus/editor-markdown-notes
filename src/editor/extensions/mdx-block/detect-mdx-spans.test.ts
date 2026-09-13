import { describe, expect, it } from 'vitest'

import { detectMdxSpans } from '#src/editor/extensions/mdx-block/detect-mdx-spans'

describe('detectMdxSpans', () => {
	it('detects a top-level import statement', () => {
		const source = "import Foo from './foo.jsx'\n\n# Heading\n"

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([
			{ start: 0, end: 27, raw: "import Foo from './foo.jsx'" },
		])
	})

	it('detects a top-level export statement', () => {
		const source = '# Heading\n\nexport const bar = 42\n'

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([
			{ start: 11, end: 32, raw: 'export const bar = 42' },
		])
	})

	it('detects a top-level JSX flow element, including its children', () => {
		const source = '# Heading\n\n<Foo prop={1}>\n  <span>child</span>\n</Foo>\n'

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([
			{
				start: 11,
				end: 53,
				raw: '<Foo prop={1}>\n  <span>child</span>\n</Foo>',
			},
		])
	})

	it('detects a top-level {expression} block', () => {
		const source = '# Heading\n\n{1 + 2}\n'

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([{ start: 11, end: 18, raw: '{1 + 2}' }])
	})

	it('detects multiple spans in the same document', () => {
		const source = "import Foo from './foo.jsx'\n\n# Heading\n\n<Foo />\n"

		const spans = detectMdxSpans(source)

		expect(spans).toHaveLength(2)
		expect(spans[0]?.raw).toBe("import Foo from './foo.jsx'")
		expect(spans[1]?.raw).toBe('<Foo />')
	})

	it('does not detect an expression nested inside a paragraph', () => {
		const source = '# Heading\n\nSome prose with {1 + 2} inline.\n'

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([])
	})

	it('does not detect JSX-looking text inside a fenced code block', () => {
		const source = '# Heading\n\n```\n<Foo prop={1} />\n```\n'

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([])
	})

	it('returns no spans for a document with no MDX constructs', () => {
		const source = '# Heading\n\nJust a plain paragraph.\n'

		const spans = detectMdxSpans(source)

		expect(spans).toEqual([])
	})

	it('returns no spans instead of throwing on an unclosed JSX tag', () => {
		const source = '# Heading\n\n<Foo\n'

		expect(() => detectMdxSpans(source)).not.toThrow()
		expect(detectMdxSpans(source)).toEqual([])
	})

	it('returns no spans instead of throwing on an incomplete import statement', () => {
		const source = "import Foo from './foo\n"

		expect(() => detectMdxSpans(source)).not.toThrow()
		expect(detectMdxSpans(source)).toEqual([])
	})
})
