import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions/extensions'

const editors: Editor[] = []

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

function documentFrom(markdown: string): Editor {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	// `setContent` runs the plugins that seed/renumber marker text;
	// constructing with `content` directly does not (see
	// `inline-code-delimiter-spec.test.ts`'s own regression on the same
	// asymmetry).
	editor.commands.setContent(markdown)
	return editor
}

describe('createMarkerSyncPlugin', () => {
	it('seeds a bullet marker on a freshly split item', () => {
		const editor = documentFrom('- First')
		// Position at the very end of "- First" (marker + text), then split via
		// Enter - the item this creates starts out with no marker at all.
		editor.commands.setTextSelection(10)
		editor.commands.splitListItem('listItem')

		expect(editor.state.doc.firstChild?.lastChild?.textContent).toBe('- ')
	})

	it('lands the cursor after a freshly seeded marker, not before it', () => {
		const editor = documentFrom('- First')
		editor.commands.setTextSelection(10)
		editor.commands.splitListItem('listItem')

		editor.commands.insertContent('Second')

		expect(editor.state.doc.firstChild?.lastChild?.textContent).toBe('- Second')
	})

	it('renumbers every item after one is removed', () => {
		const editor = documentFrom('1. First\n2. Second\n3. Third')

		const list = editor.state.doc.firstChild
		expect(list?.type.name).toBe('orderedList')
		const secondItemPos = list!.firstChild!.nodeSize + 1
		editor.commands.deleteRange({
			from: secondItemPos,
			to: secondItemPos + list!.child(1).nodeSize,
		})

		expect(editor.state.doc.firstChild?.child(0).textContent).toBe('1. First')
		expect(editor.state.doc.firstChild?.child(1).textContent).toBe('2. Third')
	})

	// Known, accepted loss (same shape as code blocks' fence-length loss):
	// markdown-it's rendered `<ul>` HTML carries no trace of which bullet
	// character the source used, so a parsed list always normalizes to `-`
	// regardless of whether the author wrote `*`/`+`/`-`.
	it('normalizes every parsed bullet to a dash', () => {
		const editor = documentFrom('* First\n* Second')

		expect(editor.state.doc.firstChild?.child(0).textContent).toBe('- First')
		expect(editor.state.doc.firstChild?.child(1).textContent).toBe('- Second')
	})
})
