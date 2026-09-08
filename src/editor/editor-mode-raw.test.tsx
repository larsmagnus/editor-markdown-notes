import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '#src/components/settings-provider'
import { EditorModeRaw } from '#src/editor/editor-mode-raw'
import { updateNotes } from '#src/lib/update-notes'

// Resolves rather than returning `undefined`: the real `updateNotes` is `async`
// and the sync effect attaches a rejection handler to what it hands back.
vi.mock('#src/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

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
	delete window.searchReveal
	localStorage.clear()
	vi.clearAllMocks()
})

describe('EditorModeRaw', () => {
	it('autosyncs the whole file, frontmatter fences included', async () => {
		const syncContent = vi.fn()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		render(
			<SettingsProvider>
				<EditorModeRaw
					content={NOTE_WITH_FRONTMATTER}
					syncContent={syncContent}
				/>
			</SettingsProvider>
		)

		await userEvent.type(screen.getByLabelText('Raw markdown'), ' Today.')

		await waitFor(
			() => {
				expect(syncContent).toHaveBeenCalledWith(
					`${NOTE_WITH_FRONTMATTER} Today.`
				)
			},
			{ timeout: 2000 }
		)
	})

	// Select-all-and-delete is the one gesture a textarea makes trivially easy,
	// and the debounce used to treat the empty result as "nothing to sync".
	it('syncs a note the author has emptied', async () => {
		const syncContent = vi.fn()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		render(
			<SettingsProvider>
				<EditorModeRaw
					content={NOTE_WITH_FRONTMATTER}
					syncContent={syncContent}
				/>
			</SettingsProvider>
		)

		await userEvent.clear(screen.getByLabelText('Raw markdown'))

		await waitFor(
			() => {
				expect(syncContent).toHaveBeenCalledWith('')
			},
			{ timeout: 2000 }
		)
	})

	it('syncs through the standalone stub when there is no host', async () => {
		render(
			<SettingsProvider>
				<EditorModeRaw content={NOTE_WITH_FRONTMATTER} syncContent={vi.fn()} />
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

	it('adopts a different note when the caret is elsewhere', async () => {
		const { rerender } = render(
			<SettingsProvider>
				<EditorModeRaw content={'# Roadmap'} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		rerender(
			<SettingsProvider>
				<EditorModeRaw content={'# Backlog'} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		expect(screen.getByLabelText('Raw markdown')).toHaveValue('# Backlog')
	})

	/**
	 * The host writes each sync to disk and echoes it straight back as an
	 * `update`, a debounce behind whatever has been typed since. Adopting that
	 * echo would drop the newest keystrokes and jump the caret to the end.
	 */
	it('ignores the host echoing an earlier sync back while typing', async () => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		const { rerender } = render(
			<SettingsProvider>
				<EditorModeRaw content={'# Roadmap'} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		await userEvent.type(screen.getByLabelText('Raw markdown'), ' 2026')

		// What the host round-trips back from the sync queued mid-word.
		rerender(
			<SettingsProvider>
				<EditorModeRaw content={'# Roadmap 20'} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		expect(screen.getByLabelText('Raw markdown')).toHaveValue('# Roadmap 2026')
	})

	/**
	 * The flip side of ignoring that echo: a change the author did not make has
	 * to arrive eventually. `content` will not change a second time, so the
	 * effect that dropped it never runs again and the view sits on text nobody
	 * wrote until the note is closed and reopened.
	 */
	it('adopts a change that arrived while the caret was in the note, once it leaves', async () => {
		const user = userEvent.setup()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}

		const { rerender } = render(
			<SettingsProvider>
				<EditorModeRaw content={'# Roadmap'} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		const textarea = screen.getByLabelText('Raw markdown')
		await user.click(textarea)

		// Someone else's edit - another tab, git - while the caret sits here.
		rerender(
			<SettingsProvider>
				<EditorModeRaw content={'# Backlog'} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		fireEvent.blur(textarea)

		expect(textarea).toHaveValue('# Backlog')
	})

	/**
	 * `content` follows this view's own syncs, so "the draft still matches what
	 * arrived" is not on its own a safe reason to adopt: an author who types and
	 * then undoes it back to the earlier text matches again, while `content` has
	 * moved on to the sync in between. Adopting there would put text on screen
	 * that the pending sync is about to contradict on disk.
	 */
	it('keeps the author’s text when they have undone their way back to it', async () => {
		const user = userEvent.setup()
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}
		const syncContent = vi.fn()

		const { rerender } = render(
			<SettingsProvider>
				<EditorModeRaw content={'# Roadmap'} syncContent={syncContent} />
			</SettingsProvider>
		)

		const textarea = screen.getByLabelText('Raw markdown')
		await user.click(textarea)
		await user.keyboard(' 2026')

		await waitFor(
			() => {
				expect(syncContent).toHaveBeenCalledWith('# Roadmap 2026')
			},
			{ timeout: 2000 }
		)

		// `useHostDocument` applies each sync locally, so the note the parent
		// holds is now this view's own text rather than anyone else's edit.
		rerender(
			<SettingsProvider>
				<EditorModeRaw content={'# Roadmap 2026'} syncContent={syncContent} />
			</SettingsProvider>
		)

		await user.keyboard(
			'{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}'
		)
		expect(textarea).toHaveValue('# Roadmap')

		fireEvent.blur(textarea)

		expect(textarea).toHaveValue('# Roadmap')
	})

	/**
	 * A textarea can highlight nothing but its own selection, so selecting the
	 * match is the highlight here. The position needs no searching, only the
	 * frontmatter the host subtracted added back - this view shows the whole
	 * file, fences included.
	 */
	it('selects the revealed match, frontmatter included', async () => {
		window.searchReveal = {
			// Body line 2, which is source line 7 once the frontmatter is added on.
			line: 2,
			column: 0,
			text: 'Ship',
			lineOffset: 5,
		}

		render(
			<SettingsProvider>
				<EditorModeRaw content={NOTE_WITH_FRONTMATTER} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		const textarea = screen.getByLabelText<HTMLTextAreaElement>('Raw markdown')

		await waitFor(() => {
			expect(
				textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
			).toBe('Ship')
		})
	})

	it('selects nothing on an ordinary open', async () => {
		render(
			<SettingsProvider>
				<EditorModeRaw content={NOTE_WITH_FRONTMATTER} syncContent={vi.fn()} />
			</SettingsProvider>
		)

		const textarea = screen.getByLabelText<HTMLTextAreaElement>('Raw markdown')

		expect(textarea.selectionStart).toBe(textarea.selectionEnd)
	})
})
