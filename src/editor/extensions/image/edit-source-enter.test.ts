import { TextSelection } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { enterImageEditSource } from '@/editor/extensions/image/edit-source'
import { createEditor } from '@/test-utils/editor'

/** The sole image node's own position in the document. */
function imagePos(editor: Editor): number {
	let pos: number | null = null
	editor.state.doc.descendants((node, at) => {
		if (node.type.name === 'image') pos = at
	})
	if (pos === null) throw new Error('no image found')
	return pos
}

/** Every image node's own position in the document, in document order. */
function imagePositions(editor: Editor): number[] {
	const positions: number[] = []
	editor.state.doc.descendants((node, at) => {
		if (node.type.name === 'image') positions.push(at)
	})
	return positions
}

/** The `imageSource` node's own position range, `[from, to)`. */
function sourceRange(editor: Editor): { from: number; to: number } {
	let range: { from: number; to: number } | null = null
	editor.state.doc.descendants((node, pos) => {
		if (node.type.name === 'imageSource')
			range = { from: pos, to: pos + node.nodeSize }
	})
	if (!range) throw new Error('no revealed source found')
	return range
}

describe('enterImageEditSource', () => {
	it('declines when the position is not an image', () => {
		const editor = createEditor('![Diagram](./diagram.png)', {
			parseOnly: true,
		})

		const applied = enterImageEditSource(0)(editor.state, editor.view.dispatch)

		expect(applied).toBe(false)
	})

	it('reveals the markdown as real text immediately before the image', () => {
		const editor = createEditor('![Diagram](./diagram.png)', {
			parseOnly: true,
		})

		enterImageEditSource(imagePos(editor))(editor.state, editor.view.dispatch)

		const { from, to } = sourceRange(editor)
		expect(editor.state.doc.textBetween(from, to)).toBe(
			'![Diagram](./diagram.png)'
		)
	})

	it('selects the path - src and title, excluding the parens - with the caret at its end', () => {
		const editor = createEditor('![Diagram](./diagram.png "A diagram")', {
			parseOnly: true,
		})

		enterImageEditSource(imagePos(editor))(editor.state, editor.view.dispatch)

		const { selection } = editor.state
		expect(selection instanceof TextSelection).toBe(true)
		expect(selection.empty).toBe(false)
		expect(editor.state.doc.textBetween(selection.from, selection.to)).toBe(
			'./diagram.png "A diagram"'
		)
		expect(selection.head).toBe(selection.to)
	})

	it('finalizes a still-open source on another image before revealing a new one', () => {
		const editor = createEditor(
			'![First](./first.png)\n\n![Second](./second.png)',
			{ parseOnly: true }
		)
		const [firstPos] = imagePositions(editor)

		enterImageEditSource(firstPos)(editor.state, editor.view.dispatch)
		const [, secondPos] = imagePositions(editor)
		enterImageEditSource(secondPos)(editor.state, editor.view.dispatch)

		expect(imagePositions(editor)).toHaveLength(2)
		const { from, to } = sourceRange(editor)
		expect(editor.state.doc.textBetween(from, to)).toBe(
			'![Second](./second.png)'
		)
	})
})
