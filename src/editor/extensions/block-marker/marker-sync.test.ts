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

describe('a marker the author deleted', () => {
	it('unwraps a heading rather than writing the marker back', () => {
		const editor = documentFrom('# Notes')
		// The whole `# ` marker, which sits at the very start of the heading.
		editor.commands.deleteRange({ from: 1, to: 3 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('Notes')
	})

	it('lifts a list item out of its list rather than reseeding the bullet', () => {
		const editor = documentFrom('- Buy milk')
		editor.commands.deleteRange({ from: 3, to: 5 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('Buy milk')
	})

	it('deletes a selection over a task marker on the first press', () => {
		const editor = documentFrom('- [ ] Ship it')
		// A selection covering the marker and the first word.
		editor.commands.deleteRange({ from: 3, to: 13 })

		expect(editor.state.doc.textContent).toBe(' it')
	})

	it('lifts a blockquote rather than reseeding its own marker', () => {
		const editor = documentFrom('> Quoted')
		editor.commands.deleteRange({ from: 2, to: 4 })

		expect(editor.state.doc.firstChild?.type.name).toBe('paragraph')
		expect(editor.state.doc.firstChild?.textContent).toBe('Quoted')
	})

	it('leaves a shortened but still valid heading marker alone', () => {
		const editor = documentFrom('### Notes')
		// One `#`, leaving `## ` - a valid marker for a level the author chose.
		editor.commands.deleteRange({ from: 1, to: 2 })

		expect(editor.state.doc.firstChild?.type.name).toBe('heading')
		expect(editor.state.doc.firstChild?.textContent).toBe('## Notes')
	})

	it('still seeds a marker on a construct that never had one', () => {
		const editor = documentFrom('Plain text')
		editor.commands.setTextSelection(3)
		editor.commands.toggleBlockquote()

		expect(editor.state.doc.firstChild?.textContent).toBe('> Plain text')
	})
})
