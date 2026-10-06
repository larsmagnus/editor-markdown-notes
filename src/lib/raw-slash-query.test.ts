import { describe, expect, it } from 'vitest'

import { findSlashQuery } from '#src/lib/raw-slash-query'

describe('findSlashQuery', () => {
	it('opens on a bare slash at the start of the document', () => {
		expect(findSlashQuery('/', 1)).toEqual({ from: 0, query: '' })
	})

	it('reads the query typed after the slash', () => {
		expect(findSlashQuery('/tab', 4)).toEqual({ from: 0, query: 'tab' })
	})

	it('opens on a slash that starts a later line', () => {
		expect(findSlashQuery('# Notes\n\n/co', 12)).toEqual({
			from: 9,
			query: 'co',
		})
	})

	it('stays closed for a slash after prose on the same line', () => {
		expect(findSlashQuery('either/or', 9)).toBeNull()
	})

	it('stays closed for a slash after leading whitespace', () => {
		expect(findSlashQuery('  /table', 8)).toBeNull()
	})

	it('stays closed once the query contains a space', () => {
		expect(findSlashQuery('/code block', 11)).toBeNull()
	})

	it('keeps later slashes in the query, leaving a path to match no command', () => {
		expect(findSlashQuery('/usr/local/bin', 14)).toEqual({
			from: 0,
			query: 'usr/local/bin',
		})
		expect(findSlashQuery('//cdn.example.com', 17)).toEqual({
			from: 0,
			query: '/cdn.example.com',
		})
	})

	it('reads only up to the caret, ignoring text after it', () => {
		expect(findSlashQuery('/tablexyz', 4)).toEqual({ from: 0, query: 'tab' })
	})

	it('stays closed with the caret before the slash', () => {
		expect(findSlashQuery('/table', 0)).toBeNull()
	})
})
