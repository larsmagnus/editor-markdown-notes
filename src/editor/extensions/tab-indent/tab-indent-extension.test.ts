import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

function documentFrom(markdown: string) {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('TabIndent', () => {
	it('inserts an indent at the caret in a paragraph', () => {
		const editor = documentFrom('Some text.')
		editor.commands.setTextSelection(1)

		editor.commands.keyboardShortcut('Tab')

		expect(editor.state.doc.textBetween(0, editor.state.doc.content.size)).toBe(
			'  Some text.'
		)
	})

	it('inserts an indent inside a frontmatter block', () => {
		const editor = documentFrom('# Roadmap')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: 'title: Roadmap' }],
		})
		// Position 1 is the very start of the frontmatter node's text content.
		editor.commands.setTextSelection(1)

		editor.commands.keyboardShortcut('Tab')

		expect(editor.state.doc.firstChild?.textContent).toBe('  title: Roadmap')
	})

	it('inserts an indent inside a code block', () => {
		const editor = documentFrom(['```ts', 'const a = 1', '```'].join('\n'))
		editor.commands.setTextSelection(1)

		editor.commands.keyboardShortcut('Tab')

		expect(editor.state.doc.firstChild?.textContent).toBe('  const a = 1')
	})

	it('removes a preceding indent on Shift-Tab', () => {
		const editor = documentFrom('# Roadmap')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: '  title: Roadmap' }],
		})
		editor.commands.setTextSelection(3)

		editor.commands.keyboardShortcut('Shift-Tab')

		expect(editor.state.doc.firstChild?.textContent).toBe('title: Roadmap')
	})

	it('does nothing to indent when there is no preceding indent to remove', () => {
		const editor = documentFrom('# Roadmap')
		editor.commands.insertContentAt(0, {
			type: 'frontmatter',
			content: [{ type: 'text', text: 'title: Roadmap' }],
		})
		editor.commands.setTextSelection(1)

		editor.commands.keyboardShortcut('Shift-Tab')

		expect(editor.state.doc.firstChild?.textContent).toBe('title: Roadmap')
	})

	it('does not indent when a node, not a text caret, is selected', () => {
		const editor = documentFrom('# Roadmap')
		editor.commands.setNodeSelection(0)

		// A NodeSelection has no text position to insert at - the assertion here
		// is only that this extension declines rather than throwing or mangling
		// the document; something else (or nothing) then owns the key.
		expect(() => editor.commands.keyboardShortcut('Tab')).not.toThrow()
		expect(editor.state.doc.textBetween(0, editor.state.doc.content.size)).toBe(
			'Roadmap'
		)
	})
})
