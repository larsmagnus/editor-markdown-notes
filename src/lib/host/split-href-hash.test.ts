import { describe, expect, it } from 'vitest'

import { splitHrefHash } from '#src/lib/host/split-href-hash'

describe('splitHrefHash', () => {
	it('splits a path from its hash', () => {
		expect(splitHrefHash('./notes.md#title')).toEqual({
			path: './notes.md',
			hash: 'title',
		})
	})

	it('returns an empty hash when there is none', () => {
		expect(splitHrefHash('./notes.md')).toEqual({
			path: './notes.md',
			hash: '',
		})
	})

	it('treats a hash-only href as an empty path', () => {
		expect(splitHrefHash('#title')).toEqual({ path: '', hash: 'title' })
	})

	it('splits on the first hash only', () => {
		expect(splitHrefHash('./notes.md#a#b')).toEqual({
			path: './notes.md',
			hash: 'a#b',
		})
	})
})
