import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import {
	markerCaretInMarker,
	nextItemMarker,
} from '#src/editor/extensions/block-marker/marker-caret'
import { createEditor, openNote } from '#src/test-utils/editor'

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

describe('nextItemMarker', () => {
	it("finds the next item's marker from the end of a paragraph", () => {
		const editor = openNote('Intro\n\n- Buy milk')
		editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 1)

		expect(nextItemMarker(editor)?.markerLength).toBe(2)
	})

	it.each([
		['a code block', '```\nconst a = 1\n```\n\n- Buy milk'],
		['a heading', '# Plan\n\n- Buy milk'],
		['an HTML block', '<div>Plan</div>\n\n- Buy milk'],
	])('leaves the next item alone from the end of %s', (_name, note) => {
		const editor = openNote(note)
		editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize - 1)

		expect(nextItemMarker(editor)).toBeNull()
	})
})
