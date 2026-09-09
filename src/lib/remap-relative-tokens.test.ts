import { describe, expect, it } from 'vitest'

import { remapRelativeTokens } from '#src/lib/remap-relative-tokens'

describe('remapRelativeTokens', () => {
	it('returns the tokens unchanged when the text has not changed', () => {
		const tokens = [{ offset: 0, length: 5, color: '#ff7b72' }]
		expect(remapRelativeTokens('hello', 'hello', tokens)).toBe(tokens)
	})

	it('keeps a token entirely before an insertion further down the text', () => {
		const tokens = [{ offset: 0, length: 5, color: '#ff7b72' }]
		expect(
			remapRelativeTokens('hello world', 'hello there world', tokens)
		).toEqual([{ offset: 0, length: 5, color: '#ff7b72' }])
	})

	it('shifts a token entirely after an insertion earlier in the text', () => {
		const tokens = [{ offset: 6, length: 5, color: '#ff7b72' }]
		expect(
			remapRelativeTokens('hello world', 'hello there world', tokens)
		).toEqual([{ offset: 12, length: 5, color: '#ff7b72' }])
	})

	it('shifts a token after a deletion earlier in the text', () => {
		// "world" sits at offset 12 in the old text ("hello there world") and
		// offset 6 in the new one ("hello world") - the deleted "there " is what
		// should get dropped, not this token.
		const tokens = [{ offset: 12, length: 5, color: '#ff7b72' }]
		expect(
			remapRelativeTokens('hello there world', 'hello world', tokens)
		).toEqual([{ offset: 6, length: 5, color: '#ff7b72' }])
	})

	it('splits a token straddling the edit, keeping both untouched ends colored', () => {
		// "world" -> "wxrld": only the "o" -> "x" is truly edited. The "w" before
		// it and the "rld" after it are still colored, just as separate
		// fragments of the original token rather than the token as a whole.
		const tokens = [{ offset: 6, length: 5, color: '#ff7b72' }]
		expect(remapRelativeTokens('hello world', 'hello wxrld', tokens)).toEqual([
			{ offset: 6, length: 1, color: '#ff7b72' },
			{ offset: 8, length: 3, color: '#ff7b72' },
		])
	})

	it('drops color only for the edited middle of a single large token', () => {
		// A whole heading line ("### Heading 3") colored as one token, with its
		// title retyped from the end - the "### " marker must stay colored even
		// though it shares a token with the text that changed.
		const tokens = [{ offset: 0, length: 13, color: '#79c0ff' }]
		expect(
			remapRelativeTokens('### Heading 3', '### Heading X', tokens)
		).toEqual([{ offset: 0, length: 12, color: '#79c0ff' }])
	})

	it('drops the whole token only when the edit covers it entirely', () => {
		const tokens = [{ offset: 6, length: 5, color: '#ff7b72' }]
		expect(remapRelativeTokens('hello world', 'hello xxxxx', tokens)).toEqual(
			[]
		)
	})

	it('keeps every token when the edit is appended at the very end', () => {
		const tokens = [
			{ offset: 0, length: 5, color: '#ff7b72' },
			{ offset: 6, length: 5, color: '#79c0ff' },
		]
		expect(remapRelativeTokens('hello world', 'hello world!', tokens)).toEqual(
			tokens
		)
	})

	it('shifts every token when the edit is inserted at the very start', () => {
		const tokens = [{ offset: 0, length: 5, color: '#ff7b72' }]
		expect(remapRelativeTokens('hello', 'oh hello', tokens)).toEqual([
			{ offset: 3, length: 5, color: '#ff7b72' },
		])
	})
})
