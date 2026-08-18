import { describe, expect, it } from 'vitest'

import { deriveQueryLength } from './search-query'

/**
 * Fixtures mirror real `search.action.getSearchResults` output from VSCode
 * 1.133.0, searching this repo.
 */
describe('deriveQueryLength', () => {
	it('recovers the query length from matches in unrelated files', () => {
		const length = deriveQueryLength([
			{
				line: 66,
				column: 1,
				lineText: '\t<input id="email" name="email" type="email" required />',
			},
			{ line: 122, column: 2, lineText: '\t\t<Input' },
			{ line: 7, column: 2, lineText: '\t\t<InputPrimitive' },
		])

		// `<input` - the point where `<Input` and `<InputPrimitive` diverge.
		expect(length).toBe(6)
	})

	it('ignores case, so a case-insensitive search still measures', () => {
		const length = deriveQueryLength([
			{ line: 1, column: 0, lineText: 'Email, and more' },
			{ line: 9, column: 4, lineText: 'the email field' },
		])

		expect(length).toBe(5)
	})

	it('runs long when the text after the matches also agrees', () => {
		// The bound, not the query: both continue with a space, so `email` reads
		// as six characters. Only more matches can shrink it.
		const length = deriveQueryLength([
			{ line: 1, column: 0, lineText: 'Email addresses go here' },
			{ line: 9, column: 4, lineText: 'the email field is required' },
		])

		expect(length).toBe(6)
	})

	it('measures a single match as its whole remaining line', () => {
		// One match cannot pin down where the query ends, so the caller gets the
		// rest of the line and must decide what to do with it.
		const length = deriveQueryLength([
			{ line: 66, column: 1, lineText: '\t<input id="email" />' },
		])

		expect(length).toBe('<input id="email" />'.length)
	})

	it('reports nothing when no match was found', () => {
		expect(deriveQueryLength([])).toBe(0)
	})

	it('reports nothing when matches share no prefix, as under a regex', () => {
		const length = deriveQueryLength([
			{ line: 1, column: 0, lineText: 'alpha' },
			{ line: 2, column: 0, lineText: 'beta' },
		])

		expect(length).toBe(0)
	})
})
