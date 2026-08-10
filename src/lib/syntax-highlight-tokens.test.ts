import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'
import { collectCodeBlocks, placeTokens } from '@/lib/syntax-highlight-tokens'

const editors: Editor[] = []

function documentFrom(markdown: string) {
	const editor = new Editor({ extensions, content: '' })
	editors.push(editor)
	editor.commands.setContent(markdown)
	return editor
}

afterEach(() => {
	editors.forEach((editor) => editor.destroy())
	editors.length = 0
})

describe('collectCodeBlocks', () => {
	it('reports a position the block text actually starts at', () => {
		const editor = documentFrom(
			['Some prose first.', '', '```ts', 'const total = 1', '```'].join('\n')
		)

		const [block] = collectCodeBlocks(editor.state.doc)

		expect(block.text).toBe('const total = 1')
		// The whole feature rests on this: tokens are placed by adding a Shiki
		// offset to `from`, so an off-by-one here colors the wrong characters.
		expect(editor.state.doc.textBetween(block.from, block.from + 15)).toBe(
			'const total = 1'
		)
	})

	it('collects every tagged block in document order', () => {
		const editor = documentFrom(
			[
				'```ts',
				'const a = 1',
				'```',
				'',
				'```css',
				'a { color: red }',
				'```',
			].join('\n')
		)

		expect(collectCodeBlocks(editor.state.doc).map((b) => b.language)).toEqual([
			'ts',
			'css',
		])
	})

	/** Mermaid blocks render as diagrams, so their source is never on screen. */
	it('skips mermaid blocks', () => {
		const editor = documentFrom(['```mermaid', 'graph TD;', '```'].join('\n'))

		expect(collectCodeBlocks(editor.state.doc)).toEqual([])
	})

	it('skips a block with no language tag', () => {
		const editor = documentFrom(['```', 'plain text', '```'].join('\n'))

		expect(collectCodeBlocks(editor.state.doc)).toEqual([])
	})

	it('returns nothing for a document with no code at all', () => {
		const editor = documentFrom('Just a paragraph.')

		expect(collectCodeBlocks(editor.state.doc)).toEqual([])
	})
})

describe('placeTokens', () => {
	it('shifts each token by the block position', () => {
		const block = { text: 'const a', language: 'ts', from: 12 }

		expect(
			placeTokens(block, [
				{ offset: 0, length: 5, color: '#ff7b72' },
				{ offset: 6, length: 1, color: '#79c0ff', fontStyle: 1 },
			])
		).toEqual([
			{ from: 12, to: 17, color: '#ff7b72', fontStyle: undefined },
			{ from: 18, to: 19, color: '#79c0ff', fontStyle: 1 },
		])
	})
})
