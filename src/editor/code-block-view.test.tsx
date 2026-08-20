import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Editor from '@/editor/editor'
import { copyToClipboard } from '@/lib/clipboard'

// Resolves rather than returning `undefined`: the real `updateNotes` is `async`
// and the save effect attaches a rejection handler to what it hands back.
vi.mock('@/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

// The app's one seam onto the clipboard, mocked here so no test has to replace
// `navigator` - a stub built from `{ ...navigator, clipboard }` drops the
// prototype getters ProseMirror reads when it constructs an editor.
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))

afterEach(() => {
	vi.clearAllMocks()
})

describe('CodeBlockView', () => {
	const content = ['```js', 'console.log(1)', '```'].join('\n')

	it('keeps the copy button revealed by keyboard focus, not just hover', async () => {
		render(<Editor content={content} />)

		const button = await screen.findByLabelText('Copy code')
		// Tab itself is unusable here: TipTap's codeBlock keymap intercepts it for
		// indentation, so happy-dom (correctly) never lands real Tab traversal on
		// this button - which is exactly why the CSS has to key off `focus-within`
		// rather than assume a `focus-visible` match on the button will follow.
		act(() => button.focus())
		expect(button).toHaveFocus()

		// The opacity class sits on ButtonCopy's own wrapper `<div>`, not the
		// button - `focus-visible` never matches a non-focusable element, so it
		// has to be `focus-within` for tabbing to the button to reveal it.
		const wrapper = button.parentElement
		expect(wrapper).toHaveClass('focus-within:opacity-100')
		expect(wrapper).not.toHaveClass('focus-visible:opacity-100')
	})

	it("marks the copy button's wrapper non-editable, since it sits inside the code block's editable content", async () => {
		render(<Editor content={content} />)

		const button = await screen.findByLabelText('Copy code')
		expect(button.parentElement).toHaveAttribute('contenteditable', 'false')
	})

	it('copies the code block text when clicked', async () => {
		render(<Editor content={content} />)

		const button = await screen.findByLabelText('Copy code')
		await userEvent.click(button)

		expect(copyToClipboard).toHaveBeenCalledWith('console.log(1)')
	})
})
