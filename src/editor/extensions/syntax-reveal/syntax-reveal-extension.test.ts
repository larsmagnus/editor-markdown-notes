import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import { SYNTAX_HIDDEN_CLASS } from '#src/editor/extensions/syntax-reveal/compute-reveal-decorations'
import { SyntaxReveal } from '#src/editor/extensions/syntax-reveal/syntax-reveal-extension'
import { createEditor } from '#src/test-utils/editor'

describe('SyntaxReveal', () => {
	it('draws the hidden class on a provider range the caret is outside of', () => {
		const editor = createEditor('<p>hello world</p>', {
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
		})
		editor.commands.setTextSelection(9) // outside the 1-6 container

		expect(editor.view.dom.innerHTML).toContain(SYNTAX_HIDDEN_CLASS)
	})

	it('omits the hidden class once the caret moves into the provider range', () => {
		const editor = createEditor('<p>hello world</p>', {
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
		})
		editor.commands.setTextSelection(3) // inside the 1-6 container

		expect(editor.view.dom.innerHTML).not.toContain(SYNTAX_HIDDEN_CLASS)
	})

	it('stays inert with no providers configured', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit, SyntaxReveal],
		})

		expect(editor.view.dom.innerHTML).not.toContain(SYNTAX_HIDDEN_CLASS)
	})
})
