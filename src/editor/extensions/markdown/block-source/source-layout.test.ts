import fc from 'fast-check'
import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'

import { buildSourceLayout } from '#src/editor/extensions/markdown/block-source/source-layout'
import type { SourceLayout } from '#src/editor/extensions/markdown/block-source/source-layout'
import { fuzzRuns } from '#src/test-utils/fuzz-runs'
import { markdownDocument } from '#src/test-utils/markdown-arbitraries'

/** The layout's top-level blocks, as markdown-it itself reports them. */
function layoutOf(text: string): SourceLayout {
	const tokens = new MarkdownIt().parse(text, {})
	const blocks = tokens.flatMap((token, id) =>
		token.level === 0 && token.nesting !== -1 && token.map
			? [{ id, map: token.map }]
			: []
	)
	return buildSourceLayout(text, blocks)
}

function rejoin({ pieces, gaps }: SourceLayout): string {
	return (
		pieces.map((piece, index) => gaps[index] + piece.text).join('') +
		gaps.at(-1)
	)
}

describe('buildSourceLayout', () => {
	it('cuts a note into its blocks and the blank lines between them', () => {
		const layout = layoutOf('# Roadmap\n\nShip it.\n\n\n- Today\n')

		expect(layout.pieces.map((piece) => piece.text)).toEqual([
			'# Roadmap',
			'Ship it.',
			'- Today',
		])
		expect(layout.gaps).toEqual(['', '\n\n', '\n\n\n', '\n'])
	})

	it('keeps a link reference definition as a piece of its own', () => {
		const layout = layoutOf(
			'See [the plan][plan].\n\n[plan]: https://example.com\n'
		)

		expect(layout.pieces).toEqual([
			expect.objectContaining({ text: 'See [the plan][plan].' }),
			{ id: null, text: '[plan]: https://example.com' },
		])
	})

	it('leaves blank lines that close a list to the gap after it', () => {
		const layout = layoutOf('- Today\n- Tomorrow\n\n\nDone.')

		expect(layout.pieces.map((piece) => piece.text)).toEqual([
			'- Today\n- Tomorrow',
			'Done.',
		])
		expect(layout.gaps).toEqual(['', '\n\n\n', ''])
	})

	it('reproduces any note exactly when its pieces are joined back up', () => {
		fc.assert(
			fc.property(markdownDocument(), (text) => {
				expect(rejoin(layoutOf(text))).toBe(text)
			}),
			{ numRuns: fuzzRuns(200) }
		)
	})
})
