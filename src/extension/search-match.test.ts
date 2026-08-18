import { describe, expect, it } from 'vitest'

import { parseFocusedMatch, parseSearchResults } from './search-match'

/**
 * Fixtures are copied verbatim out of VSCode 1.133.0, from a `<input` search
 * across this repo - the scenario the reveal feature exists for.
 */

describe('parseFocusedMatch', () => {
	it('reads the line and column of the focused match, 0-based', () => {
		const match = parseFocusedMatch(
			'67,2: \t<input id="email" name="email" type="email" required />'
		)

		expect(match).toEqual({
			line: 66,
			column: 1,
			lineText: '\t<input id="email" name="email" type="email" required />',
		})
	})

	it('distinguishes two matches sharing one line by their column', () => {
		const line = '\t<input id="email" required /><input id="second" />'

		expect(parseFocusedMatch(`8,2: ${line}`)?.column).toBe(1)
		expect(parseFocusedMatch(`8,57: ${line}`)?.column).toBe(56)
	})

	it('reports no focused match for an empty clipboard', () => {
		expect(parseFocusedMatch('')).toBeUndefined()
	})

	it('reports no focused match when a whole file was copied instead', () => {
		expect(parseFocusedMatch('/Users/lars/notes/other-note.md')).toBeUndefined()
	})
})

describe('parseSearchResults', () => {
	it('groups every match under the file holding it', () => {
		const results = [
			'/Users/lars/notes/public/other-note.md',
			'  67,2: \t<input id="email" name="email" type="email" required />',
			'',
			'/Users/lars/notes/probe-fixture.md',
			'  8,2: \t<input id="email" required /><input id="second" />',
			'  8,57: \t<input id="email" required /><input id="second" />',
			'',
		].join('\n')

		const byFile = parseSearchResults(results)

		expect([...byFile.keys()]).toEqual([
			'/Users/lars/notes/public/other-note.md',
			'/Users/lars/notes/probe-fixture.md',
		])
		expect(byFile.get('/Users/lars/notes/public/other-note.md')).toEqual([
			{
				line: 66,
				column: 1,
				lineText: '\t<input id="email" name="email" type="email" required />',
			},
		])
		expect(
			byFile.get('/Users/lars/notes/probe-fixture.md')?.map((m) => m.column)
		).toEqual([1, 56])
	})

	it('reports nothing for a search that found nothing', () => {
		expect(parseSearchResults('')).toEqual(new Map())
	})

	it('ignores a notice between a path and its matches', () => {
		// Filing the matches under the notice would leave the real file empty,
		// which reads as "nothing to reveal" rather than as a parse failure.
		const byFile = parseSearchResults(
			[
				'/Users/lars/notes/other-note.md',
				'  Showing the first 10 results',
				'  67,2: \t<input id="email" required />',
			].join('\n')
		)

		expect([...byFile.keys()]).toEqual(['/Users/lars/notes/other-note.md'])
		expect(byFile.get('/Users/lars/notes/other-note.md')).toHaveLength(1)
	})
})
