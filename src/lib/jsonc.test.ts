import { describe, expect, it } from 'vitest'

import { parseJsonc } from '@/lib/jsonc'

describe('parseJsonc', () => {
	it('parses plain JSON unchanged', () => {
		expect(parseJsonc('{"name": "One Dark Pro", "type": "dark"}')).toEqual({
			name: 'One Dark Pro',
			type: 'dark',
		})
	})

	it('strips a line comment', () => {
		const text = `{
			// this is the theme name
			"name": "Dracula"
		}`

		expect(parseJsonc(text)).toEqual({ name: 'Dracula' })
	})

	it('strips a block comment, including multi-line ones', () => {
		const text = `{
			/* generated
			   by a build script */
			"name": "Nord"
		}`

		expect(parseJsonc(text)).toEqual({ name: 'Nord' })
	})

	it('strips a trailing comma after the last object property', () => {
		expect(parseJsonc('{"name": "Nord", "type": "dark",}')).toEqual({
			name: 'Nord',
			type: 'dark',
		})
	})

	it('strips a trailing comma after the last array element', () => {
		expect(parseJsonc('{"tokenColors": ["a", "b",]}')).toEqual({
			tokenColors: ['a', 'b'],
		})
	})

	it('keeps a string value that contains a line-comment-looking sequence', () => {
		expect(parseJsonc('{"description": "// example"}')).toEqual({
			description: '// example',
		})
	})

	it('keeps a string value that contains a block-comment-looking sequence', () => {
		expect(parseJsonc('{"url": "/* not a comment */"}')).toEqual({
			url: '/* not a comment */',
		})
	})

	it('keeps an escaped quote inside a string from ending the string early', () => {
		expect(parseJsonc('{"label": "a \\"quoted\\" word"}')).toEqual({
			label: 'a "quoted" word',
		})
	})

	it('keeps a trailing-comma-looking sequence inside a string value', () => {
		expect(parseJsonc('{"note": "a, b, c,"}')).toEqual({
			note: 'a, b, c,',
		})
	})

	it('throws on genuinely malformed JSON rather than hanging', () => {
		expect(() => parseJsonc('{"name": "Nord"')).toThrow()
	})
})
