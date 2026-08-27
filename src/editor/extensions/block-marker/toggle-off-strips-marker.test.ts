import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

/**
 * `setContent` rather than `new Editor({ content })`, so the plugins that turn
 * markdown syntax into real marker text have actually run - the constructed
 * document alone has none.
 */
function documentFrom(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

/**
 * Every construct whose syntax is real leading text has to remove that text
 * when it is toggled off, or the marker survives as literal prose and reaches
 * disk on the next sync - `&gt; text`, `\- item`, a paragraph of loose
 * backticks. Every route into the toggle (toolbar, slash command, keyboard)
 * goes through these commands.
 */
describe('toggling a block construct off', () => {
	it('leaves no marker behind for a blockquote', () => {
		const editor = documentFrom('> quoted text')
		editor.commands.setTextSelection(4)

		editor.chain().toggleBlockquote().run()

		expect(editor.storage.markdown.getMarkdown()).toBe('quoted text')
	})

	it('leaves no marker behind for a bullet list', () => {
		const editor = documentFrom('- First item')
		editor.commands.setTextSelection(5)

		editor.chain().toggleBulletList().run()

		expect(editor.storage.markdown.getMarkdown()).toBe('First item')
	})

	it('leaves no marker behind for an ordered list', () => {
		const editor = documentFrom('1. First item')
		editor.commands.setTextSelection(5)

		editor.chain().toggleOrderedList().run()

		expect(editor.storage.markdown.getMarkdown()).toBe('First item')
	})

	it('leaves no marker behind for a task list', () => {
		const editor = documentFrom('- [ ] First item')
		editor.commands.setTextSelection(8)

		editor.chain().toggleTaskList().run()

		expect(editor.storage.markdown.getMarkdown()).toBe('First item')
	})

	it('leaves no fence behind for a code block', () => {
		const editor = documentFrom('```js\nconst total = 1\n```')
		editor.commands.setTextSelection(8)

		editor.chain().toggleCodeBlock().run()

		expect(editor.storage.markdown.getMarkdown()).toBe('const total = 1')
	})

	it('leaves no marker behind for a heading', () => {
		const editor = documentFrom('## A title')
		editor.commands.setTextSelection(4)

		editor.chain().toggleHeading({ level: 2 }).run()

		expect(editor.storage.markdown.getMarkdown()).toBe('A title')
	})
})
