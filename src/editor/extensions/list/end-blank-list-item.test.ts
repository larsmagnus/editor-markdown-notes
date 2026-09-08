import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { endBlankListItem } from '#src/editor/extensions/list/end-blank-list-item'
import { createEditor } from '#src/test-utils/editor'

// `setContent` runs the plugins that seed and renumber marker text;
// constructing with `content` directly does not (see `marker-sync.test.ts`).
function makeEditor(markdown: string): Editor {
	const editor = createEditor(markdown)
	return editor
}

/**
 * `splitListItem` is the command Enter runs, and the only route to a blank item
 * a unit test has - keys themselves belong in `e2e/` (see CLAUDE.md). It leaves
 * the caret in the new item, right after the marker the sync plugin seeds.
 */
describe('endBlankListItem', () => {
	it('turns a blank bullet item into a paragraph after the list', () => {
		const editor = makeEditor('- First')
		// End of the item's own text, past the list's, item's and paragraph's
		// opening tokens.
		editor.commands.setTextSelection(3 + '- First'.length)
		editor.commands.splitListItem('listItem')

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('After the list')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'- First\n\nAfter the list'
		)
	})

	it('turns a blank ordered item into a paragraph after the list', () => {
		const editor = makeEditor('1. First')
		editor.commands.setTextSelection(3 + '1. First'.length)
		editor.commands.splitListItem('listItem')

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('After the list')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'1. First\n\nAfter the list'
		)
	})

	it('turns a blank task item into a paragraph after the list', () => {
		const editor = makeEditor('- [ ] First')
		editor.commands.setTextSelection(3 + '- [ ] First'.length)
		editor.commands.splitListItem('taskItem')

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('After the list')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'- [ ] First\n\nAfter the list'
		)
	})

	it('outdents a blank nested item instead of ending the list', () => {
		const editor = makeEditor('- First')
		editor.commands.setTextSelection(3 + '- First'.length)
		editor.commands.splitListItem('listItem')
		editor.commands.sinkListItem('listItem')

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('Second')
		expect(editor.storage.markdown.getMarkdown()).toBe('- First\n- Second')
	})

	// `liftListItem` outdents into the list above only when both items are the
	// same type. Handed a mismatched pair it lifts the item clean out instead,
	// which used to leave its `- [ ] ` behind as paragraph text and write
	// `\- [ ] ` to the file.
	it('ends a task list nested under a bullet item without leaving its marker as text', () => {
		const editor = makeEditor('- One\n  - [ ] Inner')
		// Past the outer list's, item's and paragraph's openings, its own text
		// and that paragraph's close, then the nested list's, item's and
		// paragraph's openings.
		editor.commands.setTextSelection(
			4 + '- One'.length + 3 + '- [ ] Inner'.length
		)
		editor.commands.splitListItem('taskItem')

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('Lifted')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'- One\n  - [ ] Inner\n\n  Lifted'
		)
	})

	it('ends a bullet list nested under a task item without leaving its marker as text', () => {
		const editor = makeEditor('- [ ] One\n  - Inner')
		editor.commands.setTextSelection(
			4 + '- [ ] One'.length + 3 + '- Inner'.length
		)
		editor.commands.splitListItem('listItem')

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('Lifted')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'- [ ] One\n  - Inner\n\n  Lifted'
		)
	})

	// An image is an inline atom and contributes no text, so an item holding one
	// reads as marker-only by text alone and used to be lifted out of its list.
	it('declines an item whose only content is an image', () => {
		const editor = makeEditor('- ![A diagram](diagram.png)\n- Second')
		editor.commands.setTextSelection(3 + '- '.length)

		expect(endBlankListItem(editor)).toBe(false)
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'- ![A diagram](diagram.png)\n- Second'
		)
	})

	// Gating this on the marker boundary would hand `Home` then Enter back to
	// `splitListItem`, which answers one blank item with two more.
	it('ends the list from the start of the marker line too', () => {
		const editor = makeEditor('- First')
		editor.commands.setTextSelection(3 + '- First'.length)
		editor.commands.splitListItem('listItem')
		editor.commands.setTextSelection(editor.state.selection.$from.start())

		expect(endBlankListItem(editor)).toBe(true)

		editor.commands.insertContent('After the list')
		expect(editor.storage.markdown.getMarkdown()).toBe(
			'- First\n\nAfter the list'
		)
	})

	it('declines an item that has content past its marker', () => {
		const editor = makeEditor('- First')
		editor.commands.setTextSelection(3 + '- First'.length)

		expect(endBlankListItem(editor)).toBe(false)
		expect(editor.storage.markdown.getMarkdown()).toBe('- First')
	})

	it('declines an item whose marker line is followed by a nested list', () => {
		const editor = makeEditor('- First\n  - Nested')
		editor.commands.deleteRange({ from: 5, to: 3 + '- First'.length })
		// Deleting relocates the caret into the nested item, where the outer
		// item's own blank marker line is not what would be under test.
		editor.commands.setTextSelection(5)

		expect(editor.storage.markdown.getMarkdown()).toBe('- \n  - Nested')
		expect(endBlankListItem(editor)).toBe(false)
	})

	it('declines a blockquote, whose marker resolves the same way', () => {
		const editor = makeEditor('> Note')
		editor.commands.deleteRange({ from: 4, to: 2 + '> Note'.length })

		expect(editor.storage.markdown.getMarkdown()).toBe('> ')
		expect(endBlankListItem(editor)).toBe(false)
	})
})
