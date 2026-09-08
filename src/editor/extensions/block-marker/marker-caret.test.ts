import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { markerCaretInMarker } from '#src/editor/extensions/block-marker/marker-caret'
import { createEditor } from '#src/test-utils/editor'

function documentFrom(markdown: string): Editor {
	const editor = createEditor(markdown)
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
