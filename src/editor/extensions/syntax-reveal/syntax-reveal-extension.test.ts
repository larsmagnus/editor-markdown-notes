import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'

import {
	CONSTRUCT_REVEALED_CLASS,
	SYNTAX_HIDDEN_CLASS,
	SYNTAX_REVEALED_CLASS,
} from '#src/editor/extensions/syntax-reveal/compute-reveal-decorations'
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
								{
									containerFrom: 1,
									containerTo: 6,
									tokens: [{ role: 'marker', from: 1, to: 2 }],
								},
							],
						},
					],
				}),
			],
		})
		editor.commands.setTextSelection(9) // outside the 1-6 container

		expect(editor.view.dom.innerHTML).toContain(SYNTAX_HIDDEN_CLASS)
		expect(editor.view.dom.innerHTML).toContain('data-token="marker"')
	})

	it('draws the revealed class and data-token once the caret moves into the range', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [
				StarterKit,
				SyntaxReveal.configure({
					providers: [
						{
							collect: () => [
								{
									containerFrom: 1,
									containerTo: 6,
									tokens: [{ role: 'marker', from: 1, to: 2 }],
								},
							],
						},
					],
				}),
			],
		})
		editor.commands.setTextSelection(3) // inside the 1-6 container

		expect(editor.view.dom.innerHTML).not.toContain(SYNTAX_HIDDEN_CLASS)
		expect(editor.view.dom.innerHTML).toContain(SYNTAX_REVEALED_CLASS)
		expect(editor.view.dom.innerHTML).toContain('data-token="marker"')
	})

	it('draws construct-revealed on the construct element while its syntax is revealed', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [
				StarterKit,
				SyntaxReveal.configure({
					providers: [
						{
							collect: () => [
								{
									containerFrom: 1,
									containerTo: 6,
									tokens: [{ role: 'marker', from: 1, to: 2 }],
									revealedNode: [0, 13],
								},
							],
						},
					],
				}),
			],
		})
		editor.commands.setTextSelection(3)

		expect(
			editor.view.dom.querySelector(`p.${CONSTRUCT_REVEALED_CLASS}`)
		).not.toBeNull()
	})

	it('stays inert with no providers configured', () => {
		const editor = createEditor('<p>hello world</p>', {
			extensions: [StarterKit, SyntaxReveal],
		})

		expect(editor.view.dom.innerHTML).not.toContain(SYNTAX_HIDDEN_CLASS)
	})
})
