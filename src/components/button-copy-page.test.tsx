import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ButtonCopyPage } from '@/components/button-copy-page'
import { SettingsProvider } from '@/components/settings-provider'

const NOTE = ['# Roadmap', '', 'Ship it.'].join('\n')

afterEach(() => {
	delete window.vscode
	localStorage.clear()
	vi.unstubAllGlobals()
	vi.clearAllMocks()
})

describe('ButtonCopyPage', () => {
	it('copies the note as markdown', async () => {
		const user = userEvent.setup()

		render(
			<SettingsProvider>
				<ButtonCopyPage content={NOTE} />
			</SettingsProvider>
		)

		await user.click(screen.getByRole('button', { name: 'Copy page' }))

		expect(await navigator.clipboard.readText()).toBe(NOTE)
		expect(screen.getByRole('status')).toHaveTextContent('Copied')
	})

	it('asks the host for a Claude terminal inside VS Code', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		const user = userEvent.setup()

		render(
			<SettingsProvider>
				<ButtonCopyPage content={NOTE} />
			</SettingsProvider>
		)

		await user.click(screen.getByRole('button', { name: 'Open' }))
		await user.click(await screen.findByText('Open in Claude'))

		expect(postMessage).toHaveBeenCalledWith({ type: 'openClaudeTerminal' })
	})

	// Standalone the note travels by clipboard, which replaces whatever the
	// reader had on it - so it owes them the same acknowledgement a copy gets.
	it('acknowledges the copy when opening claude.ai outside VS Code', async () => {
		vi.stubGlobal('open', vi.fn())
		const user = userEvent.setup()

		render(
			<SettingsProvider>
				<ButtonCopyPage content={NOTE} />
			</SettingsProvider>
		)

		await user.click(screen.getByRole('button', { name: 'Open' }))
		await user.click(await screen.findByText('Open in Claude'))

		expect(await navigator.clipboard.readText()).toBe(NOTE)
		expect(screen.getByRole('status')).toHaveTextContent('Copied')
	})
})
