import { describe, expect, it } from 'vitest'

import { createEditor } from '@/test-utils/editor'

/**
 * HTML from a browser reaches `parseHTML` without ever passing through
 * markdown-it, so nothing on that route carries a construct's marker text.
 * `view.pasteHTML` is the path a real paste takes - `insertContentAt` runs
 * different code and does not reproduce this.
 */
describe('pasting HTML from outside the editor', () => {
	it('keeps each heading at its own level', () => {
		const editor = createEditor('<p></p>', { parseOnly: true })

		editor.view.pasteHTML('<h3>Pasted heading</h3><h5>Deeper</h5>')

		expect(editor.storage.markdown.getMarkdown()).toContain(
			'### Pasted heading'
		)
		expect(editor.storage.markdown.getMarkdown()).toContain('##### Deeper')
	})

	it('gives a pasted list its bullets', () => {
		const editor = createEditor('<p></p>', { parseOnly: true })

		editor.view.pasteHTML('<ul><li>one</li><li>two</li></ul>')

		expect(editor.storage.markdown.getMarkdown()).toContain('- one\n- two')
	})

	it('gives a pasted blockquote its marker', () => {
		const editor = createEditor('<p></p>', { parseOnly: true })

		editor.view.pasteHTML('<blockquote><p>quoted</p></blockquote>')

		expect(editor.storage.markdown.getMarkdown()).toContain('> quoted')
	})

	// An `hr` is void, so a rule pasted from a browser arrives as a node with no
	// text at all - and a rule is nothing but its own text, so it used to be
	// read as unparseable and unwrapped into an empty paragraph on arrival.
	it('keeps a pasted horizontal rule', () => {
		const editor = createEditor('<p></p>', { parseOnly: true })

		editor.view.pasteHTML('<p>Above</p><hr><p>Below</p>')

		expect(editor.storage.markdown.getMarkdown()).toContain('---')
	})

	it('leaves markdown arriving through markdown-it alone', () => {
		const editor = createEditor('<p></p>', { parseOnly: true })

		editor.commands.setContent('### From markdown\n\n- item\n\n> quote')

		expect(editor.storage.markdown.getMarkdown()).toBe(
			'### From markdown\n\n- item\n\n> quote'
		)
	})
})
