import { describe, expect, it } from 'vitest'

import {
	mdxPlaceholderIndex,
	spliceMdxPlaceholders,
} from '#src/editor/extensions/mdx-block/splice-mdx-placeholders'

describe('spliceMdxPlaceholders', () => {
	it('returns the body unchanged when there are no MDX spans', () => {
		const body = '# Heading\n\nJust a plain paragraph.\n'

		expect(spliceMdxPlaceholders(body)).toEqual({ text: body, blocks: [] })
	})

	it('replaces a single span with a placeholder, keeping the raw text', () => {
		const body = "import Foo from './foo.jsx'\n\n# Heading\n"

		const { text, blocks } = spliceMdxPlaceholders(body)

		expect(text).toBe('⟦MDX_BLOCK_0⟧\n\n# Heading\n')
		expect(blocks).toEqual(["import Foo from './foo.jsx'"])
	})

	it('replaces multiple spans with distinctly indexed placeholders', () => {
		const body = "import Foo from './foo.jsx'\n\n# Heading\n\n<Foo />\n"

		const { text, blocks } = spliceMdxPlaceholders(body)

		expect(text).toBe('⟦MDX_BLOCK_0⟧\n\n# Heading\n\n⟦MDX_BLOCK_1⟧\n')
		expect(blocks).toEqual(["import Foo from './foo.jsx'", '<Foo />'])
	})

	it('collapses a multi-line JSX span onto the placeholder line', () => {
		const body = '# Heading\n\n<Foo>\n  <span>child</span>\n</Foo>\n'

		const { text, blocks } = spliceMdxPlaceholders(body)

		expect(text).toBe('# Heading\n\n⟦MDX_BLOCK_0⟧\n')
		expect(blocks).toEqual(['<Foo>\n  <span>child</span>\n</Foo>'])
	})
})

describe('mdxPlaceholderIndex', () => {
	it('reads the index back out of a placeholder', () => {
		expect(mdxPlaceholderIndex('⟦MDX_BLOCK_0⟧')).toBe(0)
	})

	it('reads a multi-digit index', () => {
		expect(mdxPlaceholderIndex('⟦MDX_BLOCK_12⟧')).toBe(12)
	})

	it('returns null for ordinary text', () => {
		expect(mdxPlaceholderIndex('Just a plain paragraph.')).toBeNull()
	})

	it('returns null for text that merely contains a placeholder', () => {
		expect(mdxPlaceholderIndex('before ⟦MDX_BLOCK_0⟧ after')).toBeNull()
	})
})
