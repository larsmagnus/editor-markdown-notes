import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EditorBody } from '#src/editor/editor-body'
import { LIVE_EDITOR_ID } from '#src/editor/editor-mode-live-surface'
import { RAW_MARKDOWN_EDITOR_ID } from '#src/editor/editor-mode-raw'
import { skipToEditor } from '#src/editor/extensions/focus-navigation/skip-target'

// Resolves rather than returning `undefined`: the real `updateNotes` is `async`
// and the save effect attaches a rejection handler to what it hands back.
vi.mock('#src/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

// The bubble menu positions itself with floating-ui, which measures the DOM
// and throws in happy-dom the moment anything moves the selection.
vi.mock('#src/components/menu-bubble', () => ({ MenuBubble: () => null }))

afterEach(() => {
	vi.clearAllMocks()
})

/**
 * Mirrors `useHostDocument`'s own-write echo: a sync also updates the shared
 * `content` this component hands back down, the way the real host round-trip
 * does - `EditorModeRaw`'s "leave the draft alone while typing" logic depends
 * on seeing its own syncs come back through `content`.
 */
function ToggleableEditorBody({ initialContent }: { initialContent: string }) {
	const [content, setContent] = useState(initialContent)
	const [raw, setRaw] = useState(false)

	return (
		<>
			<button type="button" onClick={() => setRaw((current) => !current)}>
				Toggle raw
			</button>
			<EditorBody content={content} syncContent={setContent} raw={raw} />
		</>
	)
}

// Both views mount at once, so the raw textarea holds the same text as the
// live editor even while hidden behind it - `findByText` alone would be
// ambiguous between the two, so every query below scopes to the live editor.
function getLiveEditor(): HTMLElement {
	return document.getElementById(LIVE_EDITOR_ID) as HTMLElement
}

describe('EditorBody', () => {
	it('keeps the live editor mounted while raw mode is on screen', async () => {
		const user = userEvent.setup()
		render(<ToggleableEditorBody initialContent="Ship it." />)

		await within(getLiveEditor()).findByText('Ship it.')
		await user.click(screen.getByRole('button', { name: 'Toggle raw' }))

		await screen.findByLabelText('Raw markdown')
		expect(document.getElementById(LIVE_EDITOR_ID)).not.toBeNull()
	})

	it('undoes a raw round-trip back to what was typed in live mode', async () => {
		const user = userEvent.setup()
		render(<ToggleableEditorBody initialContent="Ship it." />)

		await user.click(await within(getLiveEditor()).findByText('Ship it.'))
		await user.keyboard(' Today.')
		await within(getLiveEditor()).findByText('Ship it. Today.')

		await user.click(screen.getByRole('button', { name: 'Toggle raw' }))
		await screen.findByLabelText('Raw markdown')
		await user.click(screen.getByRole('button', { name: 'Toggle raw' }))
		const restored = await within(getLiveEditor()).findByText('Ship it. Today.')

		// Ctrl+Z reaches whatever holds focus, which the toggle button does after
		// the clicks above - not the editor, which never autofocuses.
		await user.click(restored)
		await user.keyboard('{Control>}z{/Control}')

		expect(getLiveEditor().textContent).toBe('Ship it.')
	})

	it('sends "Skip to editor" to the raw textarea while raw is active', async () => {
		const user = userEvent.setup()
		render(<ToggleableEditorBody initialContent="Ship it." />)

		await within(getLiveEditor()).findByText('Ship it.')
		await user.click(screen.getByRole('button', { name: 'Toggle raw' }))
		await screen.findByLabelText('Raw markdown')

		skipToEditor()

		expect(document.activeElement?.id).toBe(RAW_MARKDOWN_EDITOR_ID)
	})
})
