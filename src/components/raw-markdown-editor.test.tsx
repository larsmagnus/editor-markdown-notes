import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RawMarkdownEditor } from '@/components/raw-markdown-editor'
import { SettingsProvider } from '@/components/settings-provider'
import { updateNotes } from '@/lib/update-notes'

// Resolves rather than returning `undefined`: the real `updateNotes` is `async`
// and the save effect attaches a rejection handler to what it hands back.
vi.mock('@/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

const NOTE_WITH_FRONTMATTER = [
	'---',
	'title: Second Fixture Note',
	'draft: true',
	'---',
	'',
	'# other-note.md',
	'',
	'Ship it.',
].join('\n')

afterEach(() => {
	delete window.vscode
	localStorage.clear()
	vi.clearAllMocks()
})

describe('RawMarkdownEditor', () => {
	it('autosaves the whole file, frontmatter fences included', async () => {
		const saveContent = vi.fn()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		render(
			<SettingsProvider>
				<RawMarkdownEditor
					content={NOTE_WITH_FRONTMATTER}
					saveContent={saveContent}
				/>
			</SettingsProvider>
		)

		await userEvent.type(screen.getByLabelText('Raw markdown'), ' Today.')

		await waitFor(
			() => {
				expect(saveContent).toHaveBeenCalledWith(
					`${NOTE_WITH_FRONTMATTER} Today.`
				)
			},
			{ timeout: 2000 }
		)
	})

	// Select-all-and-delete is the one gesture a textarea makes trivially easy,
	// and the debounce used to treat the empty result as "nothing to save".
	it('saves a note the author has emptied', async () => {
		const saveContent = vi.fn()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		render(
			<SettingsProvider>
				<RawMarkdownEditor
					content={NOTE_WITH_FRONTMATTER}
					saveContent={saveContent}
				/>
			</SettingsProvider>
		)

		await userEvent.clear(screen.getByLabelText('Raw markdown'))

		await waitFor(
			() => {
				expect(saveContent).toHaveBeenCalledWith('')
			},
			{ timeout: 2000 }
		)
	})

	it('saves through the standalone stub when there is no host', async () => {
		render(
			<SettingsProvider>
				<RawMarkdownEditor
					content={NOTE_WITH_FRONTMATTER}
					saveContent={vi.fn()}
				/>
			</SettingsProvider>
		)

		await userEvent.type(screen.getByLabelText('Raw markdown'), ' Today.')

		await waitFor(
			() => {
				expect(updateNotes).toHaveBeenCalledWith(
					`${NOTE_WITH_FRONTMATTER} Today.`
				)
			},
			{ timeout: 2000 }
		)
	})

	it('saves immediately on Cmd/Ctrl+S without waiting for the debounce', async () => {
		const saveContent = vi.fn()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		render(
			<SettingsProvider>
				<RawMarkdownEditor
					content={NOTE_WITH_FRONTMATTER}
					saveContent={saveContent}
				/>
			</SettingsProvider>
		)

		await userEvent.type(screen.getByLabelText('Raw markdown'), ' Today.')
		window.dispatchEvent(new CustomEvent('vscode-save-request'))

		expect(saveContent).toHaveBeenCalledWith(`${NOTE_WITH_FRONTMATTER} Today.`)
	})

	it('adopts a different note when the caret is elsewhere', async () => {
		const { rerender } = render(
			<SettingsProvider>
				<RawMarkdownEditor content={'# Roadmap'} saveContent={vi.fn()} />
			</SettingsProvider>
		)

		rerender(
			<SettingsProvider>
				<RawMarkdownEditor content={'# Backlog'} saveContent={vi.fn()} />
			</SettingsProvider>
		)

		expect(screen.getByLabelText('Raw markdown')).toHaveValue('# Backlog')
	})

	/**
	 * The host writes each save to disk and echoes it straight back as an
	 * `update`, a debounce behind whatever has been typed since. Adopting that
	 * echo would drop the newest keystrokes and jump the caret to the end.
	 */
	it('ignores the host echoing an earlier save back while typing', async () => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		const { rerender } = render(
			<SettingsProvider>
				<RawMarkdownEditor content={'# Roadmap'} saveContent={vi.fn()} />
			</SettingsProvider>
		)

		await userEvent.type(screen.getByLabelText('Raw markdown'), ' 2026')

		// What the host round-trips back from the save queued mid-word.
		rerender(
			<SettingsProvider>
				<RawMarkdownEditor content={'# Roadmap 20'} saveContent={vi.fn()} />
			</SettingsProvider>
		)

		expect(screen.getByLabelText('Raw markdown')).toHaveValue('# Roadmap 2026')
	})
})
