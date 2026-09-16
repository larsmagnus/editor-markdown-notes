import type { Editor } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { createEditor, saved } from '#src/test-utils/editor'

/** Deletes the first block, at any depth, whose text reads exactly `text`. */
function deleteBlockReading(editor: Editor, text: string): void {
	let range: { from: number; to: number } | null = null
	editor.state.doc.descendants((node, pos) => {
		if (range) return false
		if (node.type.name === 'paragraph' && node.textContent === text) {
			range = { from: pos, to: pos + node.nodeSize }
			return false
		}
		return true
	})
	if (!range) throw new Error(`No block reading "${text}"`)

	editor.commands.deleteRange(range)
}

/** How many lists sit at the top level of the note. */
function topLevelListCount(editor: Editor): number {
	let count = 0
	editor.state.doc.forEach((node) => {
		if (node.type.name.endsWith('List')) count += 1
	})
	return count
}

describe('merging lists a deletion made adjacent', () => {
	it('merges two bullet lists', () => {
		const editor = createEditor('- One\n\nSeparator\n\n- Three')

		deleteBlockReading(editor, 'Separator')

		expect(topLevelListCount(editor)).toBe(1)
		expect(saved(editor)).toBe('- One\n- Three')
	})

	it('merges two ordered lists and renumbers the second', () => {
		const editor = createEditor('1. One\n\nSeparator\n\n1. Three')

		deleteBlockReading(editor, 'Separator')

		expect(topLevelListCount(editor)).toBe(1)
		expect(saved(editor)).toBe('1. One\n2. Three')
	})

	it('merges two task lists', () => {
		const editor = createEditor('- [ ] One\n\nSeparator\n\n- [x] Three')

		deleteBlockReading(editor, 'Separator')

		expect(topLevelListCount(editor)).toBe(1)
		expect(saved(editor)).toBe('- [ ] One\n- [x] Three')
	})

	it('merges two lists nested inside a list item', () => {
		const editor = createEditor('- Parent\n  - One\n\n  Separator\n\n  - Three')

		deleteBlockReading(editor, 'Separator')

		expect(saved(editor)).toContain('  - One\n  - Three')
	})

	it('leaves apart two lists that replaced the separator', () => {
		const editor = createEditor('- One\n\nSeparator\n\n- Three')
		const pasted = createEditor('- a\n\n* b').getJSON().content ?? []
		let separator = { from: 0, to: 0 }
		editor.state.doc.descendants((node, pos) => {
			if (node.type.name === 'paragraph' && node.textContent === 'Separator') {
				separator = { from: pos, to: pos + node.nodeSize }
			}
		})

		editor.commands.insertContentAt(
			separator,
			pasted.filter((node) => node.type === 'bulletList')
		)

		expect(topLevelListCount(editor)).toBe(4)
	})

	it('leaves a bullet list and an ordered list apart', () => {
		const editor = createEditor('- One\n\nSeparator\n\n1. Three')

		deleteBlockReading(editor, 'Separator')

		expect(topLevelListCount(editor)).toBe(2)
	})
})

describe('lists authored as separate', () => {
	it('stay separate when the note loads', () => {
		const editor = createEditor('- One\n\n* Two')

		expect(topLevelListCount(editor)).toBe(2)
	})

	it('stay separate after an edit elsewhere in the note', () => {
		const editor = createEditor('- One\n\n* Two\n\nClosing words')

		deleteBlockReading(editor, 'Closing words')

		expect(topLevelListCount(editor)).toBe(2)
	})
})
