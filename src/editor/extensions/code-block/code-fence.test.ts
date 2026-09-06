import { describe, expect, it } from 'vitest'

import {
	fenceCode,
	fenceLanguage,
	fenceText,
	parseFence,
} from '@/editor/extensions/code-block/code-fence'

describe('parseFence', () => {
	it('parses a well-formed fenced block', () => {
		const text = '```ts\nconst total = 1\n```'

		expect(parseFence(text)).toEqual({
			language: 'ts',
			codeFrom: 6,
			codeTo: 21,
			hasClosingFence: true,
		})
		expect(fenceCode(text)).toBe('const total = 1')
		expect(fenceLanguage(text)).toBe('ts')
	})

	it('parses a block with no closing fence yet', () => {
		const text = '```ts\nconst total = 1'

		expect(parseFence(text)).toEqual({
			language: 'ts',
			codeFrom: 6,
			codeTo: text.length,
			hasClosingFence: false,
		})
		expect(fenceCode(text)).toBe('const total = 1')
	})

	it('parses a block with an empty language tag', () => {
		const text = '```\nplain text\n```'

		expect(parseFence(text).language).toBe('')
		expect(fenceCode(text)).toBe('plain text')
	})

	it('trims trailing whitespace from the language tag', () => {
		const text = '```ts  \nconst total = 1\n```'

		expect(fenceLanguage(text)).toBe('ts')
	})

	it('parses a block that was just opened, with no newline typed yet', () => {
		const text = '```ts'

		expect(parseFence(text)).toEqual({
			language: 'ts',
			codeFrom: 5,
			codeTo: 5,
			hasClosingFence: false,
		})
		expect(fenceCode(text)).toBe('')
	})

	it('parses a fence with no code between an immediate open and close', () => {
		const text = '```ts\n```'

		expect(parseFence(text)).toEqual({
			language: 'ts',
			codeFrom: 6,
			codeTo: 6,
			hasClosingFence: true,
		})
		expect(fenceCode(text)).toBe('')
	})

	it('parses a longer fence marker (4+ backticks)', () => {
		const text = '````ts\ncode with ``` inside\n````'

		expect(fenceLanguage(text)).toBe('ts')
		expect(fenceCode(text)).toBe('code with ``` inside')
	})

	it('treats text with no fence at all as unparsed, fence-free content', () => {
		const text = 'just some text'

		expect(parseFence(text)).toEqual({
			language: '',
			codeFrom: 0,
			codeTo: text.length,
			hasClosingFence: false,
		})
	})

	it('preserves multiple lines of code and internal blank lines', () => {
		const text = '```js\nconst a = 1\n\nconst b = 2\n```'

		expect(fenceCode(text)).toBe('const a = 1\n\nconst b = 2')
	})
})

describe('fenceText', () => {
	it('wraps code in fence lines', () => {
		expect(fenceText('const a = 1', 'ts')).toBe('```ts\nconst a = 1\n```')
	})

	// A parse/build round trip through an empty block used to insert a blank
	// line the original file never had (`fenceText('', lang)` wrote
	// ```` ```ts\n\n``` ```` for a block parsed from ```` ```ts\n``` ````),
	// so re-serializing it after any unrelated edit silently added a line.
	it('wraps empty code with no blank line between the fences', () => {
		expect(fenceText('', 'ts')).toBe('```ts\n```')
		expect(parseFence(fenceText('', 'ts'))).toEqual(parseFence('```ts\n```'))
	})
})
