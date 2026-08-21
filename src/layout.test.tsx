import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '@/components/settings-provider'
import Layout from '@/layout'

// The bubble menu positions itself with floating-ui, which measures the DOM and
// throws in happy-dom the moment anything moves the selection.
vi.mock('@/components/menu-bubble', () => ({ MenuBubble: () => null }))

afterEach(() => {
	delete window.vscode
	delete window.initialContent
	delete window.fileName
	delete window.initialScrollTop
	delete window.searchReveal
	localStorage.clear()
	vi.clearAllMocks()
})

describe('Layout', () => {
	/**
	 * The host suppresses the echo of the webview's own save, so the note the
	 * toolbar copies only stays current if the editor's save updates it here.
	 * The editor used to hold a second, private copy of the document - one
	 * nothing rendered - so its saves landed there and "Copy page" handed back
	 * the note exactly as it was when the panel opened.
	 */
	it('copies what the author has typed, not the note as it was opened', async () => {
		// `setup()` installs its own clipboard stub. Replacing `navigator`
		// wholesale would drop the prototype getters ProseMirror reads to detect
		// the browser, and the editor never mounts.
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

		// Clicked into rather than typed into straight away: the editor does not
		// autofocus, so that a note opens where it was last scrolled to rather
		// than wherever a caret puts itself.
		await user.click(await screen.findByText('Ship it.'))
		await user.keyboard(' Today.')

		// The copy reads whatever `content` holds, so it has to happen after the
		// save that carries the new text back - that write is the thing under test.
		await waitFor(
			() => {
				expect(postMessage).toHaveBeenCalledWith({
					type: 'save',
					content: 'Ship it. Today.',
				})
			},
			{ timeout: 2000 }
		)

		await user.click(screen.getByRole('button', { name: 'Copy page' }))

		expect(await navigator.clipboard.readText()).toBe('Ship it. Today.')
	})

	/**
	 * The host is the only thing that outlives the panel - VSCode disposes the
	 * webview both when the tab closes and whenever it is backgrounded - so a
	 * note only reopens where it was left if every scroll reaches it.
	 */
	it('tells the host where the reader has scrolled to', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
		window.initialContent = 'Ship it.'
		window.fileName = 'notes.md'

		const { container } = render(
			<SettingsProvider>
				<Layout defaultFileName="notes.md" />
			</SettingsProvider>
		)

		await screen.findByText('Ship it.')

		const scrollable = container.firstElementChild
		if (!scrollable) throw new Error('The note has no scroll container')
		scrollable.scrollTop = 1840
		scrollable.dispatchEvent(new Event('scroll'))

		expect(postMessage).toHaveBeenCalledWith({
			type: 'setScrollTop',
			scrollTop: 1840,
		})
	})
})
