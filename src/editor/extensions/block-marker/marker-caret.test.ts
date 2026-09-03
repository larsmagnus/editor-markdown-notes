import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { markerCaretInMarker } from '@/editor/extensions/block-marker/marker-caret'
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

describe('markerCaretInMarker', () => {
	it('finds the caret inside a blockquote marker', () => {
		const editor = documentFrom('> Quoted')
		editor.commands.setTextSelection(4)

		expect(markerCaretInMarker(editor)?.nodeTypeName).toBe('blockquote')
	})

	it('finds the caret inside a list item marker', () => {
		const editor = documentFrom('- Buy milk')
		editor.commands.setTextSelection(5)

		expect(markerCaretInMarker(editor)?.nodeTypeName).toBe('listItem')
	})
})
