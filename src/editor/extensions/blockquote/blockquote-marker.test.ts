import { describe, expect, it } from 'vitest'

import { blockquoteMarkerLength } from '#src/editor/extensions/blockquote/blockquote-marker'

describe('blockquoteMarkerLength', () => {
	it('returns 2 for text starting with "> "', () => {
		expect(blockquoteMarkerLength('> Ship it')).toBe(2)
	})

	it('returns 0 for text with no marker', () => {
		expect(blockquoteMarkerLength('Ship it')).toBe(0)
	})

	it('returns 0 for a bare ">" with no trailing space', () => {
		expect(blockquoteMarkerLength('>Ship it')).toBe(0)
	})

	it('returns 0 for an empty string', () => {
		expect(blockquoteMarkerLength('')).toBe(0)
	})
})
