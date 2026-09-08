import { NodeSelection } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import {
	cancelImageSource,
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

function replaceSelectionText(editor: Editor, text: string): void {
	const { selection } = editor.state
	editor.view.dispatch(
		editor.state.tr.insertText(text, selection.from, selection.to)
	)
}

describe('cancelImageSource', () => {
	it('reverts to the original attrs and selects the image', () => {
		const editor = editorWithSourceRevealed('![Diagram](./diagram.png)')
		replaceSelectionText(editor, './broken')

		cancelImageSource()(editor.state, editor.view.dispatch)

		expect(editor.state.selection instanceof NodeSelection).toBe(true)
		expect(editor.getAttributes('image').src).toBe('./diagram.png')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'![Diagram](./diagram.png)'
		)
	})
})
