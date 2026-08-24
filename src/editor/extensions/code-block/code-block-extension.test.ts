import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

describe('CodeBlockExtension keyboard shortcuts', () => {
	// Regression: `addKeyboardShortcuts()` used to return only its own
	// `Backspace` entry, which - unlike `addKeyboardShortcuts` on a fresh
	// `Node.create()` - silently replaces the stock `CodeBlock` extension's
	// whole shortcut map instead of adding to it, dropping `Mod-Alt-c`
	// (toggle) and, worse, triple-Enter/ArrowUp/ArrowDown-to-exit: a keyboard
	// trap at a code block's edges with no escape.
	it('still toggles a code block on Mod-Alt-c', () => {
		const editor = new Editor({
			extensions,
			content: '<p>const total = 1</p>',
		})
		editor.commands.setTextSelection(1)

		editor.commands.keyboardShortcut('Mod-Alt-c')

		expect(editor.state.doc.firstChild?.type.name).toBe('codeBlock')
	})

	it('still exits the block on triple Enter at its end', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					content: [{ type: 'text', text: '```ts\nconst a = 1\n```' }],
				},
			],
		})
		editor.commands.setTextSelection(editor.state.doc.content.size - 1)

		editor.commands.keyboardShortcut('Enter')
		editor.commands.keyboardShortcut('Enter')
		editor.commands.keyboardShortcut('Enter')

		expect(editor.state.selection.$from.parent.type.name).toBe('paragraph')
	})

	it('still unwraps the block at fence start on Backspace', () => {
		const editor = new Editor({ extensions, content: '' })
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					content: [{ type: 'text', text: '```ts\nconst a = 1\n```' }],
				},
			],
		})
		editor.commands.setTextSelection(1)

		editor.commands.keyboardShortcut('Backspace')

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
	})
})
