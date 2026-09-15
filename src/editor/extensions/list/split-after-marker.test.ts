import { describe, expect, it } from 'vitest'

import { splitAfterMarker } from '#src/editor/extensions/list/split-after-marker'
import { createEditor } from '#src/test-utils/editor'

function documentFrom(markdown: string) {
	const editor = createEditor()
	editor.commands.setContent(markdown)
	return editor
}

describe('splitAfterMarker', () => {
	describe('bullet lists', () => {
		it('prevents marker duplication when split mid-marker', () => {
			const editor = documentFrom('- Buy milk')
			// Position inside the marker: doc start (3) + offset inside `- ` marker
			editor.commands.setTextSelection(4)

			const result = splitAfterMarker(editor)

			expect(result).toBe(true)
			expect(editor.state.doc.firstChild?.childCount).toBe(2)
			const markdown = editor.storage.markdown.getMarkdown()
			expect(markdown).not.toContain('- -')
		})
	})

	describe('ordered lists', () => {
		it('prevents marker duplication when split mid-marker', () => {
			const editor = documentFrom('1. Buy milk')
			// Position inside the marker: doc start (3) + offset inside `1. ` marker
			editor.commands.setTextSelection(4)

			const result = splitAfterMarker(editor)

			expect(result).toBe(true)
			expect(editor.state.doc.firstChild?.childCount).toBe(2)
			const markdown = editor.storage.markdown.getMarkdown()
			expect(markdown).not.toContain('1. 1.')
		})
	})

	describe('task lists', () => {
		it('prevents marker duplication when split mid-marker', () => {
			const editor = documentFrom('- [ ] Buy milk')
			// Position inside the marker: doc start (3) + offset inside `- [ ] ` marker
			editor.commands.setTextSelection(5)

			const result = splitAfterMarker(editor)

			expect(result).toBe(true)
			expect(editor.state.doc.firstChild?.childCount).toBe(2)
			const markdown = editor.storage.markdown.getMarkdown()
			expect(markdown).not.toContain('- [ ] - [ ]')
		})
	})

	describe('integration with ListEnter extension', () => {
		it('pressing Enter mid-marker splits without duplication', () => {
			const editor = documentFrom('- Buy milk')
			editor.commands.setTextSelection(4)

			const handled = editor.commands.splitListItem('listItem')

			expect(handled).toBe(true)
			const markdown = editor.storage.markdown.getMarkdown()
			expect(markdown).not.toContain('- -')
			expect(editor.state.doc.firstChild?.childCount).toBe(2)
		})
	})
})
