import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'
import { enterImageEditSource } from '@/editor/extensions/image/edit-source'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

/** An editor with `content` and its sole image's source revealed. */
function editorWithSourceRevealed(content: string): Editor {
	const editor = new Editor({ extensions, content })
	editors.push(editor)

	let imagePos: number | null = null
	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === 'image') imagePos = pos
	})
	if (imagePos === null) throw new Error('no image found')

	enterImageEditSource(imagePos)(editor.state, editor.view.dispatch)
	return editor
}

function replaceSelectionText(editor: Editor, text: string): void {
	const { selection } = editor.state
	editor.view.dispatch(
		editor.state.tr.insertText(text, selection.from, selection.to)
	)
}

/** The image node's own attrs, found by walking the doc rather than reading the selection. */
function imageSrc(editor: Editor): string | undefined {
	let src: string | undefined
	editor.state.doc.descendants((node) => {
		if (node.type.name === 'image') src = String(node.attrs.src)
	})
	return src
}

describe('the image source sync plugin', () => {
	it('updates the image live as the revealed text is edited', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')

		replaceSelectionText(editor, './renamed.png')

		expect(imageSrc(editor)).toBe('./renamed.png')
	})

	it('leaves the image alone while the revealed text is mid-edit and unparseable', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')

		replaceSelectionText(editor, './renamed')
		editor.view.dispatch(editor.state.tr.insertText('.png "unterminated'))

		// The last text that *did* parse, not the pre-edit value - each valid
		// keystroke syncs live, and only garbage is left uncommitted.
		expect(imageSrc(editor)).toBe('./renamed')
	})

	it('finalizes and hides the revealed text once the selection moves elsewhere', () => {
		const editor = editorWithSourceRevealed(
			'![Diagram](./diagram.png)\n\nSome text.'
		)
		replaceSelectionText(editor, './renamed.png')

		editor.commands.setTextSelection(editor.state.doc.content.size - 1)

		let hasSourceNode = false
		editor.state.doc.descendants((node) => {
			if (node.type.name === 'imageSource') hasSourceNode = true
		})
		expect(hasSourceNode).toBe(false)
		expect(imageSrc(editor)).toBe('./renamed.png')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'![Diagram](./renamed.png)\n\nSome text.'
		)
	})

	it('deletes the image if the text was cleared before the selection moved away', () => {
		const editor = editorWithSourceRevealed(
			'Some text.\n\n![Diagram](./diagram.png)'
		)

		let range: { from: number; to: number } | null = null
		editor.state.doc.descendants((node, pos) => {
			if (node.type.name === 'imageSource')
				range = { from: pos, to: pos + node.nodeSize }
		})
		if (!range) throw new Error('no revealed source found')
		const { from, to } = range
		editor.view.dispatch(editor.state.tr.delete(from + 1, to - 1))

		editor.commands.setTextSelection(1)

		expect(editor.storage.markdown.getMarkdown()).toBe('Some text.')
	})
})
