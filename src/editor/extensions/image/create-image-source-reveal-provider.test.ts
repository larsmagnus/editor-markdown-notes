import { describe, expect, it } from 'vitest'

import { createImageSourceRevealProvider } from '#src/editor/extensions/image/create-image-source-reveal-provider'
import { enterImageEditSource } from '#src/editor/extensions/image/edit-source'
import { createEditor } from '#src/test-utils/editor'

describe('createImageSourceRevealProvider', () => {
	it('returns nothing when no image source is revealed', () => {
		const editor = createEditor('![Diagram](./diagram.png)', {
			parseOnly: true,
		})

		expect(createImageSourceRevealProvider().collect(editor.state.doc)).toEqual(
			[]
		)
	})

	it('tags the revealed markdown as always-revealed, regardless of the selection', () => {
		const editor = createEditor('![Diagram](./diagram.png)', {
			parseOnly: true,
		})
		let imagePos: number | null = null
		editor.state.doc.descendants((node, pos) => {
			if (node.type.name === 'image') imagePos = pos
		})
		if (imagePos === null) throw new Error('no image found')
		enterImageEditSource(imagePos)(editor.state, editor.view.dispatch)

		const [span] = createImageSourceRevealProvider().collect(editor.state.doc)

		expect(span.containerFrom).toBe(0)
		expect(span.containerTo).toBe(editor.state.doc.content.size)
		expect(span.tokens.length).toBeGreaterThan(0)
		expect(span.tokens.every((token) => token.role === 'marker')).toBe(false)
	})
})
