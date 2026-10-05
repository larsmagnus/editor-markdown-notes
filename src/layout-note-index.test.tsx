import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '#src/components/settings-provider'
import Layout from '#src/layout'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '#src/shared/messages'

// The bubble menu positions itself with floating-ui, which measures the DOM and
// throws in happy-dom the moment anything moves the selection.
vi.mock('#src/components/menu-bubble', () => ({ MenuBubble: () => null }))

afterEach(() => {
	delete window.vscode
	delete window.initialContent
	delete window.fileName
	delete window.initialConfig
	localStorage.clear()
	vi.clearAllMocks()
})

describe('Layout index, inside VS Code', () => {
	it('asks the host for the index and opens the chosen note', async () => {
		const user = userEvent.setup()
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = '# Today'
		window.fileName = 'today.md'

		render(
			<SettingsProvider>
				<Layout defaultFileName="today.md" />
			</SettingsProvider>
		)

		await user.click(await screen.findByRole('button', { name: 'Open index' }))

		expect(postMessage).toHaveBeenCalledWith({
			type: 'getNoteIndex',
			requestId: 1,
			respectGitignore: true,
			showAiToolFolders: true,
		})
		expect(await screen.findByText('Finding notes…')).toBeTruthy()

		window.dispatchEvent(
			new MessageEvent('message', {
				data: {
					type: 'noteIndex',
					requestId: 1,
					total: 1,
					directories: [],
					hiddenDirectories: [],
					gitUnavailable: false,
					entries: [
						{
							uri: 'file:///workspace/.claude/agents/code-reviewer.md',
							fileName: 'code-reviewer.md',
							directory: '.claude/agents',
							title: 'code-reviewer',
							content: null,
							tags: [],
							modified: 1_790_000_000_000,
							size: 5_600,
							characters: 5_600,
							words: 900,
							current: false,
						},
					],
				},
			})
		)

		await user.click(
			await screen.findByRole('button', { name: 'code-reviewer' })
		)

		expect(postMessage).toHaveBeenCalledWith({
			type: 'openNoteIndexEntry',
			uri: 'file:///workspace/.claude/agents/code-reviewer.md',
			beside: false,
		})
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})

	it('asks the host to open a Cmd-clicked note beside', async () => {
		const user = userEvent.setup()
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = '# Today'
		window.fileName = 'today.md'

		render(
			<SettingsProvider>
				<Layout defaultFileName="today.md" />
			</SettingsProvider>
		)

		await user.click(await screen.findByRole('button', { name: 'Open index' }))
		window.dispatchEvent(
			new MessageEvent('message', {
				data: {
					type: 'noteIndex',
					requestId: 1,
					total: 1,
					directories: [],
					hiddenDirectories: [],
					gitUnavailable: false,
					entries: [
						{
							uri: 'file:///workspace/docs/roadmap.md',
							fileName: 'roadmap.md',
							directory: 'docs',
							title: 'Quarterly roadmap',
							content: null,
							tags: [],
							modified: 1_790_000_000_000,
							size: 900,
							characters: 900,
							words: 150,
							current: false,
						},
					],
				},
			})
		)

		const card = await screen.findByRole('button', {
			name: 'Quarterly roadmap',
		})
		await user.keyboard('{Meta>}')
		await user.click(card)
		await user.keyboard('{/Meta}')

		expect(postMessage).toHaveBeenCalledWith({
			type: 'openNoteIndexEntry',
			uri: 'file:///workspace/docs/roadmap.md',
			beside: true,
		})
	})

	it('says so when the host could not list the notes', async () => {
		const user = userEvent.setup()
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = '# Today'
		window.fileName = 'today.md'

		render(
			<SettingsProvider>
				<Layout defaultFileName="today.md" />
			</SettingsProvider>
		)

		await user.click(await screen.findByRole('button', { name: 'Open index' }))
		window.dispatchEvent(
			new MessageEvent('message', {
				data: { type: 'noteIndexFailed', requestId: 1 },
			})
		)

		expect(
			await screen.findByText(
				'Could not list the notes. “Editor Markdown Notes: Show logs” has the details.'
			)
		).toBeTruthy()
		expect(screen.queryByText('Finding notes…')).toBeNull()
	})

	it('opens when the host asks it to, from the command palette', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = '# Today'
		window.fileName = 'today.md'

		render(
			<SettingsProvider>
				<Layout defaultFileName="today.md" />
			</SettingsProvider>
		)

		window.dispatchEvent(
			new MessageEvent('message', { data: { type: 'showNoteIndex' } })
		)

		expect(await screen.findByRole('dialog', { name: 'Index' })).toBeTruthy()
		expect(postMessage).toHaveBeenCalledWith({
			type: 'getNoteIndex',
			requestId: 1,
			respectGitignore: true,
			showAiToolFolders: true,
		})
	})

	it('opens from the command palette with the toolbar hidden', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = '# Today'
		window.fileName = 'today.md'
		window.initialConfig = {
			settings: { ...DEFAULT_SETTINGS, hideToolbar: true },
			viewOptions: DEFAULT_VIEW_OPTIONS,
		}

		render(
			<SettingsProvider>
				<Layout defaultFileName="today.md" />
			</SettingsProvider>
		)

		window.dispatchEvent(
			new MessageEvent('message', { data: { type: 'showNoteIndex' } })
		)

		expect(await screen.findByRole('dialog', { name: 'Index' })).toBeTruthy()
	})
})
