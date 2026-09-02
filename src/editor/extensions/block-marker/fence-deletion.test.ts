import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

function documentFrom(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

/**
 * A code block's fences are its own text, so deleting them is how a writer
 * turns one back into a paragraph. Repair answering that with a fresh pair is
 * what made the block impossible to unwrap: every backtick deleted came back.
 */
describe('a fence the author deleted', () => {
	it('unwraps a code block into a paragraph holding its code', () => {
		const editor = documentFrom('```js\nconst x = 1\n```')
		// The opening fence line, "```js\n", at the very start of the block.
		editor.commands.deleteRange({ from: 1, to: 7 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('const x = 1')
	})

	it('unwraps a mermaid block the same way', () => {
		const editor = documentFrom('```mermaid\ngraph TD\n```')
		editor.commands.deleteRange({ from: 1, to: 12 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('graph TD')
	})

	it('still fences a code block that never had one', () => {
		const editor = documentFrom('Plain text')
		editor.commands.setTextSelection(3)
		editor.commands.toggleCodeBlock()

		expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock')
		expect(editor.state.doc.firstChild?.textContent).toBe(
			'```\nPlain text\n```'
		)
	})
})
