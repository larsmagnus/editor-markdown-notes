import { describe, expect, it } from 'vitest'

import { styleFor, styleObjectFor } from '#src/lib/shiki-token-style'

describe('styleFor', () => {
	it('renders just the color for a token with no font style', () => {
		expect(styleFor({ color: '#ff7b72' })).toBe('color:#ff7b72')
	})

	it('renders each font style bit the token carries', () => {
		expect(styleFor({ color: '#ff7b72', fontStyle: 1 | 2 | 4 | 8 })).toBe(
			'color:#ff7b72;font-style:italic;font-weight:bold;text-decoration:underline;text-decoration:line-through'
		)
	})

	/** Shiki's `FontStyle.NotSet` is `-1`, which has every style bit set. */
	it('applies no font style for the NotSet sentinel', () => {
		expect(styleFor({ color: '#ff7b72', fontStyle: -1 })).toBe('color:#ff7b72')
	})
})

describe('styleObjectFor', () => {
	it('returns just the color for a token with no font style', () => {
		expect(styleObjectFor({ color: '#ff7b72' })).toEqual({
			color: '#ff7b72',
			fontStyle: undefined,
			fontWeight: undefined,
			textDecoration: undefined,
		})
	})

	it('sets italic and bold independently', () => {
		expect(styleObjectFor({ color: '#ff7b72', fontStyle: 1 })).toEqual(
			expect.objectContaining({ fontStyle: 'italic', fontWeight: undefined })
		)
		expect(styleObjectFor({ color: '#ff7b72', fontStyle: 2 })).toEqual(
			expect.objectContaining({ fontStyle: undefined, fontWeight: 'bold' })
		)
	})

	it('joins underline and strikethrough into one textDecoration', () => {
		expect(styleObjectFor({ color: '#ff7b72', fontStyle: 4 | 8 })).toEqual(
			expect.objectContaining({ textDecoration: 'underline line-through' })
		)
	})

	/** Shiki's `FontStyle.NotSet` is `-1`, which has every style bit set. */
	it('applies no font style for the NotSet sentinel', () => {
		expect(styleObjectFor({ color: '#ff7b72', fontStyle: -1 })).toEqual({
			color: '#ff7b72',
			fontStyle: undefined,
			fontWeight: undefined,
			textDecoration: undefined,
		})
	})
})
