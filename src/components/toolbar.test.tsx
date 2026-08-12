import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '@/components/settings-provider'
import Toolbar from '@/components/toolbar'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

const STORAGE_KEY = 'editor-markdown-notes:view-options'

afterEach(() => {
	localStorage.clear()
	delete window.vscode
	delete window.initialConfig
	vi.clearAllMocks()
})

/**
 * The toggle group hands back the full list of pressed values, so the handler
 * rebuilds every view option from it. Anything missing from either the forward
 * or the inverse mapping is silently reset the next time any other toggle is
 * used - hence a case per toggle, each asserting the other two survive.
 */
describe('view option toggles', () => {
	it('turns on full width without disturbing the others', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true })
		)
		render(
			<SettingsProvider>
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
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
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Toggle text tools'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.textTools).toBe(true)
		expect(stored.raw).toBe(true)
		expect(stored.fullWidth).toBe(true)
	})
})

describe('edit mode', () => {
	it('switches from raw to live editor', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true })
		)
		render(
			<SettingsProvider>
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Live editor'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.raw).toBe(false)
	})

	it('switches from live to raw editor', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: false })
		)
		render(
			<SettingsProvider>
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Raw editor'))

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		expect(stored.raw).toBe(true)
	})

	it('reflects the stored options as the pressed edit mode', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_VIEW_OPTIONS, raw: true, textTools: true })
		)
		render(
			<SettingsProvider>
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
			</SettingsProvider>
		)

		expect(screen.getByLabelText('Raw editor')).toHaveAttribute('data-pressed')
		expect(screen.getByLabelText('Live editor')).not.toHaveAttribute(
			'data-pressed'
		)
		expect(screen.getByLabelText('Toggle full width')).not.toHaveAttribute(
			'data-pressed'
		)
		expect(screen.getByLabelText('Toggle text tools')).toHaveAttribute(
			'data-pressed'
		)
	})

	it('hides the text editor button in the standalone web app', () => {
		render(
			<SettingsProvider>
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
			</SettingsProvider>
		)

		expect(screen.queryByLabelText('Text editor')).not.toBeInTheDocument()
	})

	it('asks the host to open the file in the text editor, without persisting anything', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialConfig = {
			viewOptions: DEFAULT_VIEW_OPTIONS,
			settings: DEFAULT_SETTINGS,
		}
		render(
			<SettingsProvider>
				<Toolbar
					files={[]}
					fileName="notes.md"
					setFileName={() => {}}
					content=""
				/>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Text editor'))

		expect(postMessage).toHaveBeenCalledTimes(1)
		expect(postMessage).toHaveBeenCalledWith({ type: 'openInTextEditor' })
		expect(screen.getByLabelText('Live editor')).toHaveAttribute('data-pressed')
	})
})
