import { describe, expect, it } from 'vitest'

import { alignedSlices, positionMapper } from '@/mcp/source-position'

describe('alignedSlices', () => {
	it('keeps mapping text after a named character reference', () => {
		const source = 'Some&mdash;text'
		const value = 'Some—text'
		const slices = alignedSlices(value, source, 0, 0)
		const mapper = positionMapper(source, slices)

		expect(mapper(value.indexOf('text'))).toEqual({
			line: 1,
			column: source.indexOf('text') + 1,
		})
	})

	it('keeps mapping text after a numeric character reference', () => {
		const source = 'Some&#8212;text'
		const value = 'Some—text'
		const slices = alignedSlices(value, source, 0, 0)
		const mapper = positionMapper(source, slices)

		expect(mapper(value.indexOf('text'))).toEqual({
			line: 1,
			column: source.indexOf('text') + 1,
		})
	})

	it('keeps mapping text after two character references in the same run', () => {
		const source = 'a&mdash;b&nbsp;c'
		const value = 'a—b c'
		const slices = alignedSlices(value, source, 0, 0)
		const mapper = positionMapper(source, slices)

		expect(mapper(value.indexOf('c'))).toEqual({
			line: 1,
			column: source.indexOf('c') + 1,
		})
	})

	it('still maps backslash escapes correctly', () => {
		const source = 'a\\*b'
		const value = 'a*b'
		const slices = alignedSlices(value, source, 0, 0)
		const mapper = positionMapper(source, slices)

		expect(mapper(value.indexOf('b'))).toEqual({
			line: 1,
			column: source.indexOf('b') + 1,
		})
	})
})
