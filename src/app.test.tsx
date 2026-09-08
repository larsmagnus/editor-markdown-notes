import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '#src/app'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '#src/shared/messages'

// The bubble menu positions itself with floating-ui, which measures the DOM
// and throws in happy-dom. Nothing here tests the menu.
vi.mock('#src/components/menu-bubble', () => ({ MenuBubble: () => null }))

const NOTE = '---\ntitle: Roadmap\n---\n\n# Roadmap\n\nShip it.'

/**
 * Everything the host injects ahead of the bundle, so the app boots straight
 * into the VSCode path on its first render.
 */
function bootInsideVSCode({ raw }: { raw: boolean }) {
	const postMessage = vi.fn()

	window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
	window.initialContent = NOTE
	window.fileName = 'notes.md'
	window.initialConfig = {
		viewOptions: { ...DEFAULT_VIEW_OPTIONS, raw },
		settings: DEFAULT_SETTINGS,
	}

	return postMessage
}

afterEach(() => {
	delete window.vscode
	delete window.initialContent
	delete window.fileName
	delete window.initialConfig
	vi.clearAllMocks()
})

describe('autosaving to the host', () => {
	it('posts the raw markdown view once the typing pauses', async () => {
		const postMessage = bootInsideVSCode({ raw: true })

		render(<App />)

		await userEvent.type(
			await screen.findByRole('textbox', { name: 'Raw markdown' }),
			' Today.'
		)

		await waitFor(
			() => {
				expect(postMessage).toHaveBeenCalledWith({
					type: 'syncDocument',
					content: `${NOTE} Today.`,
				})
			},
			{ timeout: 2000 }
		)
	})
})
