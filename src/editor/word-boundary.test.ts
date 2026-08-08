import { describe, expect, it } from 'vitest'

import { isWordChar } from '@/editor/word-boundary'

describe('isWordChar', () => {
	it('is true for a letter', () => {
		expect(isWordChar('a')).toBe(true)
	})

	it('is true for a digit', () => {
		expect(isWordChar('5')).toBe(true)
	})

	it('is false for whitespace', () => {
		expect(isWordChar(' ')).toBe(false)
	})

	it('is false for punctuation', () => {
		expect(isWordChar('.')).toBe(false)
	})

	it('is false for undefined', () => {
		expect(isWordChar(undefined)).toBe(false)
	})
})
