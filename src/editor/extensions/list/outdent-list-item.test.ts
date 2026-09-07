import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { markerCaretAtBoundary } from '@/editor/extensions/block-marker/marker-caret'
import { extensions } from '@/editor/extensions/extensions'
import { parseListMarker } from '@/editor/extensions/list/list-marker'
import { outdentListItem } from '@/editor/extensions/list/outdent-list-item'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

// `setContent` runs the plugins that seed and renumber marker text;
// constructing with `content` directly does not (see `marker-sync.test.ts`).
function makeEditor(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

/**
 * The caret Shift-Tab acts on, in the item reading `text`: one position past
 * that item's own marker, and nowhere else - anywhere further along, Shift-Tab
 * means "remove an indent" instead.
 */
function caretAfterMarkerOf(editor: Editor, text: string) {
	let start = -1
	editor.state.doc.descendants((node, pos) => {
		if (start === -1 && node.isTextblock && node.textContent === text) {
			start = pos + 1
		}
	})
	if (start === -1) throw new Error(`No item reading "${text}"`)

	const markerLength = parseListMarker(text)?.markerLength
	if (markerLength === undefined) throw new Error(`No marker in "${text}"`)

	editor.commands.setTextSelection(start + markerLength)
	const caret = markerCaretAtBoundary(editor)
	if (!caret) throw new Error(`No marker boundary in "${text}"`)
	return caret
}

/**
 * `liftListItem` only ever outdents into an outer list of the same item type.
 * Every other shape used to lift the item's content clean out while leaving its
 * marker behind as ordinary text, which serializes escaped (`\- Two`) and
 * reaches the file as prose.
 */
describe('outdentListItem', () => {
	it('outdents a nested item into the list above it', () => {
		const editor = makeEditor('- One\n  - Two')
		const caret = caretAfterMarkerOf(editor, '- Two')

		expect(outdentListItem(editor, caret)).toBe(true)
		expect(editor.storage.markdown.getMarkdown()).toBe('- One\n- Two')
	})

	it('turns a top-level item into a paragraph, marker and all', () => {
		const editor = makeEditor('- One\n- Two')
		const caret = caretAfterMarkerOf(editor, '- Two')

		expect(outdentListItem(editor, caret)).toBe(true)
		expect(editor.storage.markdown.getMarkdown()).toBe('- One\n\nTwo')
	})

	it('turns a task item nested under a bullet item into a paragraph', () => {
		const editor = makeEditor('- One\n  - [ ] Two')
		const caret = caretAfterMarkerOf(editor, '- [ ] Two')

		expect(outdentListItem(editor, caret)).toBe(true)
		expect(editor.storage.markdown.getMarkdown()).toBe('- One\n\n  Two')
	})

	it('keeps the rest of the item’s content when it leaves the list', () => {
		const editor = makeEditor('- Buy milk')
		const caret = caretAfterMarkerOf(editor, '- Buy milk')

		expect(outdentListItem(editor, caret)).toBe(true)
		expect(editor.storage.markdown.getMarkdown()).toBe('Buy milk')
	})
})
