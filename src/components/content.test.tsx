import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Content from '@/components/content'
import { SettingsProvider } from '@/components/settings-provider'

// The bubble menu positions itself with floating-ui, which measures the DOM and
// throws in happy-dom the moment anything moves the selection.
vi.mock('@/editor/menu-bubble', () => ({ MenuBubble: () => null }))

afterEach(() => {
	delete window.vscode
	delete window.initialContent
	delete window.fileName
	localStorage.clear()
	vi.clearAllMocks()
})

describe('Content', () => {
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
				<Content defaultFileName="notes.md" />
			</SettingsProvider>
		)

		await screen.findByText('Ship it.')
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
})
