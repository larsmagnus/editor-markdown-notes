import { render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '@/components/settings-provider'
import { LIVE_EDITOR_ID } from '@/editor/editor-mode-live-surface'
import Layout from '@/layout'

// The bubble menu positions itself with floating-ui, which measures the DOM and
// throws in happy-dom the moment anything moves the selection.
vi.mock('@/components/menu-bubble', () => ({ MenuBubble: () => null }))

afterEach(() => {
	delete window.vscode
	delete window.initialContent
	delete window.fileName
	localStorage.clear()
	vi.clearAllMocks()
})

// The hidden raw textarea now mounts the same text as the live editor, so
// `screen.findByText` alone is ambiguous between the two - every query below
// scopes to whichever one is actually on screen. `within` throws its own clear
// error against `null`, so nothing here re-checks that the editor mounted.
function getLiveEditor(): HTMLElement {
	return document.getElementById(LIVE_EDITOR_ID) as HTMLElement
}

describe('Layout, when the host reports an outside change', () => {
	/**
	 * An external edit must not come back out of the editor as a sync.
	 *
	 * The host replaces the whole document on an `update`, and that replacement
	 * looks exactly like a user edit to the autosync - so the editor writes its
	 * own re-serialization back over a file it was only told about. Whatever the
	 * markdown round-trip does not preserve is destroyed on disk with nobody
	 * having touched the note.
	 */
	it('shows the new text without writing anything back', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = 'Ship it.'
		window.fileName = 'notes.md'

		render(
			<SettingsProvider>
				<Layout defaultFileName="notes.md" />
			</SettingsProvider>
		)

		await within(getLiveEditor()).findByText('Ship it.')

		window.dispatchEvent(
			new MessageEvent('message', {
				data: {
					type: 'update',
					content: 'Ship it tomorrow.',
					fileName: 'notes.md',
				},
			})
		)

		await within(getLiveEditor()).findByText('Ship it tomorrow.')

		// Past the 1000ms autosync debounce, which is the whole window in which
		// the editor could decide to write the change back at the host.
		await new Promise((resolve) => setTimeout(resolve, 1500))

		expect(postMessage).not.toHaveBeenCalledWith(
			expect.objectContaining({ type: 'syncDocument' })
		)
	})

	/**
	 * The guard against fixing the above by simply not saving. An edit the author
	 * makes after an outside change still has to reach disk.
	 */
	it('still saves what the author types afterwards', async () => {
		const user = userEvent.setup()

		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = 'Ship it.'
		window.fileName = 'notes.md'

		render(
			<SettingsProvider>
				<Layout defaultFileName="notes.md" />
			</SettingsProvider>
		)

		await within(getLiveEditor()).findByText('Ship it.')

		window.dispatchEvent(
			new MessageEvent('message', {
				data: {
					type: 'update',
					content: 'Ship it tomorrow.',
					fileName: 'notes.md',
				},
			})
		)

		// Clicked into rather than typed into straight away: the editor does not
		// autofocus, so that a note opens where it was last scrolled to rather
		// than wherever a caret puts itself.
		await user.click(
			await within(getLiveEditor()).findByText('Ship it tomorrow.')
		)
		await user.keyboard(' Really.')

		await waitFor(
			() => {
				expect(postMessage).toHaveBeenCalledWith({
					type: 'syncDocument',
					content: 'Ship it tomorrow. Really.',
				})
			},
			{ timeout: 2000 }
		)
	})
})
