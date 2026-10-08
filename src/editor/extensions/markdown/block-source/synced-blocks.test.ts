import { describe, expect, it } from 'vitest'

import { buildExtensions } from '#src/editor/extensions/build-extensions'
import { hasUnsyncedChanges } from '#src/editor/extensions/markdown/block-source/synced-blocks'
import { loadNoteContent } from '#src/editor/load-note-content'
import { createEditor } from '#src/test-utils/editor'

describe('hasUnsyncedChanges', () => {
	it('reports nothing for an MDX note the author has not touched', () => {
		const editor = createEditor('', { extensions: buildExtensions('mdx') })
		loadNoteContent(editor, '# Plan\n\n<Chart data={sales} />\n', {
			fileKind: 'mdx',
			addToHistory: false,
		})

		expect(hasUnsyncedChanges(editor)).toBe(false)
	})

	it('reports an edit the author has not synced', () => {
		const editor = createEditor('# Plan\n\nShip it.')
		editor.commands.setTextSelection(editor.state.doc.content.size - 1)
		editor.view.dispatch(editor.state.tr.insertText(' Today'))

		expect(hasUnsyncedChanges(editor)).toBe(true)
	})
})
