import { NodeSelection } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import {
	commitImageSource,
	enterImageEditSource,
} from '#src/editor/extensions/image/edit-source'
import { createEditor } from '#src/test-utils/editor'

/** An editor with `content` and its sole image's source revealed. */
function editorWithSourceRevealed(content: string): Editor {
	const editor = createEditor(content, { parseOnly: true })

	let imagePos: number | null = null
	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === 'image') imagePos = pos
	})
	if (imagePos === null) throw new Error('no image found')

	enterImageEditSource(imagePos)(editor.state, editor.view.dispatch)
	return editor
}

/** The `imageSource` node's own position range, `[from, to)`. */
function sourceRange(editor: Editor): { from: number; to: number } {
	let range: { from: number; to: number } | null = null
	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === 'imageSource')
			range = { from: pos, to: pos + node.nodeSize }
	})
	if (!range) throw new Error('no revealed source found')
	return range
}

function replaceSelectionText(editor: Editor, text: string): void {
	const { selection } = editor.state
	editor.view.dispatch(
		editor.state.tr.insertText(text, selection.from, selection.to)
	)
}

describe('commitImageSource', () => {
	it('declines when the caret is not inside the revealed text', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')
		editor.commands.setTextSelection(editor.state.doc.content.size)

		const applied = commitImageSource()(editor.state, editor.view.dispatch)
		expect(applied).toBe(false)
	})

	it('parses the edited text into the image and selects it', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')
		replaceSelectionText(editor, './renamed.png')

		commitImageSource()(editor.state, editor.view.dispatch)

		expect(editor.state.selection instanceof NodeSelection).toBe(true)
		expect(editor.getAttributes('image').src).toBe('./renamed.png')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'![Diagram](./renamed.png)'
		)
	})

	it('deletes the image when the text is cleared', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')
		const { from, to } = sourceRange(editor)
		editor.view.dispatch(editor.state.tr.delete(from + 1, to - 1))
		editor.commands.setTextSelection(from + 1)

		commitImageSource()(editor.state, editor.view.dispatch)

		expect(editor.storage.markdown.getMarkdown()).toBe('')
	})

	it('reverts unparseable text rather than deleting the image', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')
		// Removes the closing paren, leaving the text mid-edit rather than empty.
		const { to } = sourceRange(editor)
		editor.view.dispatch(editor.state.tr.delete(to - 2, to - 1))
		editor.commands.setTextSelection(to - 2)

		commitImageSource()(editor.state, editor.view.dispatch)

		expect(editor.getAttributes('image').src).toBe('./diagram.png')
	})
})
