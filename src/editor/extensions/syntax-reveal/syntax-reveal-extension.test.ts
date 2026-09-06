import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { afterEach, describe, expect, it } from 'vitest'

import { SYNTAX_HIDDEN_CLASS } from '@/editor/extensions/syntax-reveal/compute-reveal-decorations'
import { SyntaxReveal } from '@/editor/extensions/syntax-reveal/syntax-reveal-extension'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('SyntaxReveal', () => {
	it('draws the hidden class on a provider range the caret is outside of', () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				SyntaxReveal.configure({
					providers: [
						{
							collect: () => [
								{ containerFrom: 1, containerTo: 6, syntaxRanges: [[1, 2]] },
							],
						},
					],
				}),
			],
			content: '',
		})
		editors.push(editor)
		editor.commands.setContent('<p>hello world</p>')
		editor.commands.setTextSelection(9) // outside the 1-6 container

		expect(editor.view.dom.innerHTML).toContain(SYNTAX_HIDDEN_CLASS)
	})

	it('omits the hidden class once the caret moves into the provider range', () => {
		const editor = new Editor({
			extensions: [
				StarterKit,
				SyntaxReveal.configure({
					providers: [
						{
							collect: () => [
								{ containerFrom: 1, containerTo: 6, syntaxRanges: [[1, 2]] },
							],
						},
					],
				}),
			],
			content: '',
		})
		editors.push(editor)
		editor.commands.setContent('<p>hello world</p>')
		editor.commands.setTextSelection(3) // inside the 1-6 container

		expect(editor.view.dom.innerHTML).not.toContain(SYNTAX_HIDDEN_CLASS)
	})

	it('stays inert with no providers configured', () => {
		const editor = new Editor({
			extensions: [StarterKit, SyntaxReveal],
			content: '',
		})
		editors.push(editor)
		editor.commands.setContent('<p>hello world</p>')

		expect(editor.view.dom.innerHTML).not.toContain(SYNTAX_HIDDEN_CLASS)
	})
})
