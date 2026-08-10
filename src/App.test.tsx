import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

// The bubble menu positions itself with floating-ui, which measures the DOM
// and throws in happy-dom. Nothing here tests the menu.
vi.mock('@/editor/menu-bubble', () => ({ MenuBubble: () => null }))

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

/**
 * The keystroke lands on the page, not on the editor, so it travels
 * `useSaveShortcut` -> a `vscode-save-request` event on `window` -> the listener
 * in `useNoteSave` -> `postMessage`. Those halves are covered individually; this
 * is the only test that joins them, and a mistake in the wiring between them
 * shows up nowhere else.
 */
describe('Cmd/Ctrl+S reaching the host', () => {
	it('posts the raw markdown view straight to the host', async () => {
		const postMessage = bootInsideVSCode({ raw: true })

		render(<App />)

		const textarea = await screen.findByRole('textbox', {
			name: 'Raw markdown',
		})
		await userEvent.click(textarea)
		await userEvent.keyboard(' Today.')
		await userEvent.keyboard('{Meta>}s{/Meta}')

		expect(postMessage).toHaveBeenCalledWith({
			type: 'save',
			content: `${NOTE} Today.`,
		})
	})

	it('posts the rich editor document, frontmatter reattached', async () => {
		const postMessage = bootInsideVSCode({ raw: false })

		render(<App />)

		await screen.findByRole('heading', { name: 'Roadmap' })
		await userEvent.click(screen.getByText('Ship it.'))
		await userEvent.keyboard(' Today.')
		await userEvent.keyboard('{Control>}s{/Control}')

		expect(postMessage).toHaveBeenCalledWith({
			type: 'save',
			content: '---\ntitle: Roadmap\n---\n\n# Roadmap\n\nShip it. Today.',
		})
	})

	it('posts a note the author has emptied in the raw view', async () => {
		const postMessage = bootInsideVSCode({ raw: true })

		render(<App />)

		await userEvent.clear(
			await screen.findByRole('textbox', { name: 'Raw markdown' })
		)
		await userEvent.keyboard('{Meta>}s{/Meta}')

		expect(postMessage).toHaveBeenCalledWith({ type: 'save', content: '' })
	})
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
					type: 'save',
					content: `${NOTE} Today.`,
				})
			},
			{ timeout: 2000 }
		)
	})
})
