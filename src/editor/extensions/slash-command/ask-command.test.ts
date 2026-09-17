import { afterEach, describe, expect, it, vi } from 'vitest'

import { runAskCommand } from '#src/editor/extensions/slash-command/ask-command'
import { createEditor } from '#src/test-utils/editor'

const ask = vi.hoisted(() => vi.fn())
const cancel = vi.hoisted(() => vi.fn())
vi.mock('#src/lib/ask/ask-client', () => ({
	getAskClient: () => ({ ask, cancel }),
}))

// Mounting the real prompt box needs `coordsAtPos`, real DOM layout happy-dom
// does not provide (the same reason `MenuBubble` is stubbed in
// `editor.test.tsx`) - `openAskPromptPopup` itself is a thin, one-line mount
// wrapper, so a mock exercises everything worth asserting on here: that it
// runs, with the right arguments.
const openAskPromptPopup = vi.hoisted(() => vi.fn())
vi.mock('#src/editor/extensions/slash-command/ask-prompt-render', () => ({
	openAskPromptPopup,
}))

afterEach(() => {
	vi.clearAllMocks()
})

describe('runAskCommand', () => {
	it('deletes the /ask range and opens a free-text prompt box at the caret', async () => {
		const editor = createEditor('<p>/ask summarise</p>', { parseOnly: true })
		const range = { from: 1, to: editor.state.doc.content.size - 1 }

		runAskCommand(editor, range)

		expect(editor.getText()).toBe('')
		// Opening is deferred a tick past `Suggestion`'s own exit teardown -
		// see the comment on the `setTimeout` in `runAskCommand`.
		await vi.waitFor(() =>
			expect(openAskPromptPopup).toHaveBeenCalledWith(
				editor,
				range.from,
				expect.any(Function)
			)
		)
	})
})
