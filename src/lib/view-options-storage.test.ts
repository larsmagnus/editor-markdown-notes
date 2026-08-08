import { afterEach, describe, expect, it } from 'vitest'

import {
	readStoredViewOptions,
	VIEW_OPTIONS_STORAGE_KEY,
	writeStoredViewOptions,
} from '@/lib/view-options-storage'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

afterEach(() => {
	localStorage.clear()
})

describe('readStoredViewOptions', () => {
	it('falls back to the defaults with nothing stored', () => {
		expect(readStoredViewOptions()).toEqual(DEFAULT_VIEW_OPTIONS)
	})

	/** A blanked editor is much worse than a lost preference. */
	it('falls back to the defaults for unparseable JSON', () => {
		localStorage.setItem(VIEW_OPTIONS_STORAGE_KEY, '{ not json')

		expect(readStoredViewOptions()).toEqual(DEFAULT_VIEW_OPTIONS)
	})

	it('falls back per field for a value of the wrong type', () => {
		localStorage.setItem(
			VIEW_OPTIONS_STORAGE_KEY,
			JSON.stringify({ raw: 'yes', fullWidth: true })
		)

		const stored = readStoredViewOptions()

		expect(stored.raw).toBe(DEFAULT_VIEW_OPTIONS.raw)
		expect(stored.fullWidth).toBe(true)
	})

	it('drops a key that is not a view option', () => {
		localStorage.setItem(
			VIEW_OPTIONS_STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, somethingElse: 'kept?' })
		)

		expect(readStoredViewOptions()).not.toHaveProperty('somethingElse')
	})
})

describe('writeStoredViewOptions', () => {
	it('round-trips through storage', () => {
		writeStoredViewOptions({
			...DEFAULT_VIEW_OPTIONS,
			raw: true,
			theme: 'dark',
		})

		const stored = readStoredViewOptions()

		expect(stored.raw).toBe(true)
		expect(stored.theme).toBe('dark')
	})
})
