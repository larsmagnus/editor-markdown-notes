import { describe, expect, it } from 'vitest'

import { lineIndexAt } from '#src/lib/line-index-at'

describe('lineIndexAt', () => {
	const text = 'first\nsecond\n\nfourth'

	it('puts the start of the text on the first line', () => {
		expect(lineIndexAt(text, 0)).toBe(0)
	})

	it('keeps a caret at the end of a line on that line', () => {
		expect(lineIndexAt(text, 5)).toBe(0)
	})

	it('moves to the next line right after a newline', () => {
		expect(lineIndexAt(text, 6)).toBe(1)
	})

	it('counts an empty line', () => {
		expect(lineIndexAt(text, 13)).toBe(2)
	})

	it('puts the end of the text on the last line', () => {
		expect(lineIndexAt(text, text.length)).toBe(3)
	})

	it('puts a caret after a trailing newline on the empty last line', () => {
		expect(lineIndexAt('note\n', 5)).toBe(1)
	})
})
