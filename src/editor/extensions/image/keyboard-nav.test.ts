import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { moveToAdjacentImage } from '@/editor/extensions/image/keyboard-nav'
import { createEditor } from '@/test-utils/editor'

const TWO_IMAGES = [
	'Before',
	'',
	'![First](./first.png)',
	'',
	'Between',
	'',
	'![Second](./second.png)',
	'',
	'After',
].join('\n')

function editorWith(markdown: string): Editor {
	const editor = createEditor(markdown)
	return editor
}

function run(editor: Editor, dir: 1 | -1): boolean {
	return moveToAdjacentImage(dir)(
		editor.state,
		editor.view.dispatch,
		editor.view
	)
}

function selectedImageAlt(editor: Editor): string | undefined {
	return editor.getAttributes('image').alt
}

describe('moveToAdjacentImage', () => {
	it('walks forward through every image, then declines', () => {
		const editor = editorWith(TWO_IMAGES)
		editor.commands.setTextSelection(1)

		expect(run(editor, 1)).toBe(true)
		expect(selectedImageAlt(editor)).toBe('First')

		expect(run(editor, 1)).toBe(true)
		expect(selectedImageAlt(editor)).toBe('Second')

		expect(run(editor, 1)).toBe(false)
	})

	it('walks backward through every image, then declines', () => {
		const editor = editorWith(TWO_IMAGES)
		editor.commands.setTextSelection(editor.state.doc.content.size)

		expect(run(editor, -1)).toBe(true)
		expect(selectedImageAlt(editor)).toBe('Second')

		expect(run(editor, -1)).toBe(true)
		expect(selectedImageAlt(editor)).toBe('First')

		expect(run(editor, -1)).toBe(false)
	})

	it('declines on a document with no images', () => {
		const editor = editorWith('Just some text')
		editor.commands.setTextSelection(1)

		expect(run(editor, 1)).toBe(false)
	})
})
