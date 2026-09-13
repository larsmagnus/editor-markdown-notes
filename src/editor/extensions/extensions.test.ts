import { describe, expect, it } from 'vitest'

import { buildExtensions } from '#src/editor/extensions/build-extensions'
import { createEditor } from '#src/test-utils/editor'

describe('buildExtensions', () => {
	// markdown-it has no concept of frontmatter, so a leading `---` block is
	// parsed as a horizontal rule regardless of file kind - the frontmatter node
	// only ever reaches the document through `useFrontmatterDocument`'s explicit
	// `insertContentAt`, which is what these cases exercise instead.
	it('registers a frontmatter node in the schema for markdown files', () => {
		const editor = createEditor('# Roadmap', { extensions: buildExtensions('markdown') })

		expect(Boolean(editor.schema.nodes.frontmatter)).toBe(true)
	})

	it('omits the frontmatter node from the schema for txt files', () => {
		const editor = createEditor('# Roadmap', { extensions: buildExtensions('txt') })

		expect(editor.schema.nodes.frontmatter).toBeUndefined()
	})

	it('accepts an inserted frontmatter node as the document first child for markdown files', () => {
		const editor = createEditor('# Roadmap', { extensions: buildExtensions('markdown') })

		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '---\ntitle: Roadmap\n---' }],
		})

		expect(editor.state.doc.firstChild?.type.name).toBe('frontmatter')
	})

	it('parses a leading --- block as an ordinary horizontal rule for txt files', () => {
		const editor = createEditor('---\ntitle: Roadmap\n---\n# Roadmap', {
			extensions: buildExtensions('txt'),
		})

		expect(editor.state.doc.firstChild?.type.name).toBe('horizontalRule')
	})

	it('parses ordinary markdown identically for markdown and txt files', () => {
		const markdownEditor = createEditor('# Heading\n\nSome text.', {
			extensions: buildExtensions('markdown'),
		})
		const txtEditor = createEditor('# Heading\n\nSome text.', {
			extensions: buildExtensions('txt'),
		})

		expect(txtEditor.getText()).toBe(markdownEditor.getText())
	})
})
