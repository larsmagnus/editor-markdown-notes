import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { SettingsProvider } from '@/components/settings-provider'
import Toolbar from '@/components/toolbar'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

const STORAGE_KEY = 'editor-markdown-notes:view-options'

afterEach(() => {
	localStorage.clear()
})

/**
 * The toggle group hands back the full list of pressed values, so the handler
 * rebuilds every view option from it. Anything missing from either the forward
 * or the inverse mapping is silently reset the next time any other toggle is
 * used - hence a case per toggle, each asserting the other two survive.
 */
describe('view option toggles', () => {
	it('turns on raw markdown without disturbing the others', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, fullWidth: true })
		)
		render(
			<SettingsProvider>
				<Toolbar files={[]} fileName="notes.md" setFileName={() => {}} />
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Toggle raw markdown'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.raw).toBe(true)
		expect(stored.fullWidth).toBe(true)
		expect(stored.textTools).toBe(false)
	})

	it('turns on full width without disturbing the others', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true })
		)
		render(
			<SettingsProvider>
				<Toolbar files={[]} fileName="notes.md" setFileName={() => {}} />
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Toggle full width'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.fullWidth).toBe(true)
		expect(stored.raw).toBe(true)
		expect(stored.textTools).toBe(false)
	})

	it('turns on text tools without disturbing the others', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true, fullWidth: true })
		)
		render(
			<SettingsProvider>
				<Toolbar files={[]} fileName="notes.md" setFileName={() => {}} />
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Toggle text tools'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.textTools).toBe(true)
		expect(stored.raw).toBe(true)
		expect(stored.fullWidth).toBe(true)
	})

	it('turns an active toggle back off', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true })
		)
		render(
			<SettingsProvider>
				<Toolbar files={[]} fileName="notes.md" setFileName={() => {}} />
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Toggle raw markdown'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.raw).toBe(false)
	})

	it('reflects the stored options as pressed toggles', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true, textTools: true })
		)
		render(
			<SettingsProvider>
				<Toolbar files={[]} fileName="notes.md" setFileName={() => {}} />
			</SettingsProvider>
		)

		expect(screen.getByLabelText('Toggle raw markdown')).toHaveAttribute(
			'data-state',
			'on'
		)
		expect(screen.getByLabelText('Toggle full width')).toHaveAttribute(
			'data-state',
			'off'
		)
		expect(screen.getByLabelText('Toggle text tools')).toHaveAttribute(
			'data-state',
			'on'
		)
	})
})
