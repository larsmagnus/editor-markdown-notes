import { describe, expect, it } from 'vitest'

import { alignBlocks } from '#src/editor/extensions/markdown/block-source/align-blocks'

describe('alignBlocks', () => {
	it('keeps every block whose text is unchanged and replaces the one that changed', () => {
		const alignment = alignBlocks(
			['# Roadmap', 'Ship it.', 'Done.'],
			['# Roadmap', 'Ship it today.', 'Done.']
		)

		expect(alignment).toEqual([
			{ kind: 'keep', current: 0, incoming: 0 },
			{ kind: 'replace', current: [1, 2], incoming: [1, 2] },
			{ kind: 'keep', current: 2, incoming: 2 },
		])
	})

	it('never matches a block the author has changed', () => {
		const alignment = alignBlocks(
			['# Roadmap', null],
			['# Roadmap', 'Ship it.']
		)

		expect(alignment).toEqual([
			{ kind: 'keep', current: 0, incoming: 0 },
			{ kind: 'replace', current: [1, 2], incoming: [1, 2] },
		])
	})

	it('aligns blocks that moved past an inserted one', () => {
		const alignment = alignBlocks(['A', 'B'], ['New', 'A', 'B'])

		expect(alignment).toEqual([
			{ kind: 'replace', current: [0, 0], incoming: [0, 1] },
			{ kind: 'keep', current: 0, incoming: 1 },
			{ kind: 'keep', current: 1, incoming: 2 },
		])
	})
})
