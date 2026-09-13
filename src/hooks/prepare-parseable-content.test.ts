import { describe, expect, it } from 'vitest'

import { prepareParseableContent } from '#src/hooks/prepare-parseable-content'

describe('prepareParseableContent', () => {
	it('leaves plain markdown untouched for a markdown file', () => {
		const content = '# Heading\n\nSome text.\n'

		expect(prepareParseableContent(content, 'markdown')).toEqual({
			frontmatter: null,
			body: content,
			mdxBlocks: [],
		})
	})

	it('splits frontmatter off for a markdown file', () => {
		const content = '---\ntitle: Roadmap\n---\n\n# Heading\n'

		expect(prepareParseableContent(content, 'markdown')).toEqual({
			frontmatter: 'title: Roadmap',
			body: '# Heading\n',
			mdxBlocks: [],
		})
	})

	it('leaves a leading --- block untouched for a txt file', () => {
		const content = '---\ntitle: Roadmap\n---\n\n# Heading\n'

		expect(prepareParseableContent(content, 'txt')).toEqual({
			frontmatter: null,
			body: content,
			mdxBlocks: [],
		})
	})

	it('splices MDX spans out of the body for an mdx file', () => {
		const content = "import Foo from './foo.jsx'\n\n# Heading\n"

		expect(prepareParseableContent(content, 'mdx')).toEqual({
			frontmatter: null,
			body: '⟦MDX_BLOCK_0⟧\n\n# Heading\n',
			mdxBlocks: ["import Foo from './foo.jsx'"],
		})
	})

	it('splits frontmatter off before splicing MDX spans for an mdx file', () => {
		const content =
			"---\ntitle: Roadmap\n---\n\nimport Foo from './foo.jsx'\n\n# Heading\n"

		expect(prepareParseableContent(content, 'mdx')).toEqual({
			frontmatter: 'title: Roadmap',
			body: '⟦MDX_BLOCK_0⟧\n\n# Heading\n',
			mdxBlocks: ["import Foo from './foo.jsx'"],
		})
	})
})
