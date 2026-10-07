import { describe, expect, it } from 'vitest'

import { sweep } from '#src/lib/offset-sweep'

describe('sweep', () => {
	it('finds the span covering each offset asked in order, and nothing between spans', () => {
		const spanAt = sweep(
			[
				{ name: 'heading', from: 0, to: 9 },
				{ name: 'link', from: 12, to: 20 },
			],
			(span) => [span.from, span.to]
		)

		expect(
			[0, 8, 9, 11, 12, 19, 20].map((offset) => spanAt(offset)?.name)
		).toEqual([
			'heading',
			'heading',
			undefined,
			undefined,
			'link',
			'link',
			undefined,
		])
	})
})
