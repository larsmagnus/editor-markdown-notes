import { describe, expect, it } from 'vitest'

import {
	alignedSlices,
	sourceOffsetAt,
} from '#src/lib/text-tools/source-offset'

describe('sourceOffsetAt', () => {
	it('maps straight through when nothing was decoded', () => {
		const slices = alignedSlices('written', 'written', 0, 10)

		expect(sourceOffsetAt(slices, 0)).toBe(10)
		expect(sourceOffsetAt(slices, 4)).toBe(14)
	})

	it('maps past a character reference to where it starts in the source', () => {
		const source = 'Some&mdash;text'
		const value = 'Some—text'
		const slices = alignedSlices(value, source, 0, 0)

		expect(sourceOffsetAt(slices, value.indexOf('text'))).toBe(
			source.indexOf('text')
		)
	})

	it('maps past a backslash escape to the escaped character', () => {
		const source = 'a\\*b'
		const value = 'a*b'
		const slices = alignedSlices(value, source, 0, 0)

		expect(sourceOffsetAt(slices, value.indexOf('b'))).toBe(source.indexOf('b'))
	})

	it('has nothing to map with no slices at all', () => {
		expect(sourceOffsetAt([], 0)).toBeNull()
	})
})
