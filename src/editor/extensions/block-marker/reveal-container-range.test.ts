import { describe, expect, it } from 'vitest'

import { revealContainerRange } from '#src/editor/extensions/block-marker/reveal-container-range'

describe('revealContainerRange', () => {
	it('spans the whole node for revealScope "node", regardless of markerHost', () => {
		expect(
			revealContainerRange(
				{ markerHost: 'self', revealScope: 'node' },
				10,
				20,
				3
			)
		).toEqual([10, 30])
	})

	it('spans just the marker text for revealScope "marker" with markerHost "self"', () => {
		expect(
			revealContainerRange(
				{ markerHost: 'self', revealScope: 'marker' },
				10,
				20,
				3
			)
		).toEqual([11, 14])
	})

	it('spans just the marker text for revealScope "marker" with markerHost "firstParagraph"', () => {
		expect(
			revealContainerRange(
				{ markerHost: 'firstParagraph', revealScope: 'marker' },
				10,
				20,
				3
			)
		).toEqual([12, 15])
	})
})
