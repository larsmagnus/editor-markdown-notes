import { describe, expect, it } from 'vitest'

import { contentWidthClassName } from '@/lib/content-width-class'

describe('contentWidthClassName', () => {
	it('lifts the prose width cap when full width is on', () => {
		expect(
			contentWidthClassName({ fullWidth: true, centerContent: false })
		).toBe('max-w-full')
	})

	it('stays full width even when centring is also on', () => {
		expect(
			contentWidthClassName({ fullWidth: true, centerContent: true })
		).toBe('max-w-full')
	})

	it('centres against the cap when asked', () => {
		expect(
			contentWidthClassName({ fullWidth: false, centerContent: true })
		).toBe('mx-auto')
	})

	it('adds nothing when neither is on', () => {
		expect(
			contentWidthClassName({ fullWidth: false, centerContent: false })
		).toBe('')
	})
})
