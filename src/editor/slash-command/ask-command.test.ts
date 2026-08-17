import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { askInlineStatusPluginKey } from '@/editor/ask-inline-status-extension'
import { extensions } from '@/editor/extensions'

import { runAskCommand, streamAskInto } from './ask-command'

const ask = vi.hoisted(() => vi.fn())
const cancel = vi.hoisted(() => vi.fn())
vi.mock('@/lib/ai-ask/ask-client', () => ({
	getAskClient: () => ({ ask, cancel }),
}))

// Mounting the real prompt box needs `coordsAtPos`, real DOM layout happy-dom
// does not provide (the same reason `MenuBubble` is stubbed in
// `editor.test.tsx`) - `openAskPromptPopup` itself is a thin, one-line mount
// wrapper, so a mock exercises everything worth asserting on here: that it
// runs, with the right arguments.
const openAskPromptPopup = vi.hoisted(() => vi.fn())
vi.mock('@/editor/slash-command/ask-prompt-render', () => ({
	openAskPromptPopup,
}))

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
	document.body.innerHTML = ''
	vi.clearAllMocks()
})

describe('runAskCommand', () => {
	it('deletes the /ask range and opens a free-text prompt box at the caret', async () => {
		const editor = new Editor({ extensions, content: '<p>/ask summarise</p>' })
		currentEditor = editor
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

describe('streamAskInto', () => {
	it('shows the loading widget immediately, before any reply arrives', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		streamAskInto(editor, 1, 'Summarise this note')

		expect(editor.getText()).toBe('')
		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'loading',
			pos: 1,
		})
	})

	it('clears the loading widget and inserts each streamed chunk, cumulatively', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		streamAskInto(editor, 1, 'Summarise this note')
		const handlers = ask.mock.calls[0]?.[2]

		handlers.onChunk('Hello')
		expect(editor.getText()).toBe('Hello')
		expect(askInlineStatusPluginKey.getState(editor.state)).toBeNull()

		handlers.onChunk(' world')
		expect(editor.getText()).toBe('Hello world')
	})

	it('keeps inserting streamed chunks in the right place after an edit earlier in the doc', () => {
		const editor = new Editor({ extensions, content: '<p>Hello world</p>' })
		currentEditor = editor

		// Position 12, right after "world" - the end of the paragraph.
		streamAskInto(editor, 12, 'Summarise this note')
		const handlers = ask.mock.calls[0]?.[2]
		handlers.onChunk('Hi')

		// An edit earlier in the doc shifts every later position forward by 6.
		editor.chain().insertContentAt(1, 'Well, ').run()

		handlers.onChunk(' there')

		expect(editor.getText()).toBe('Well, Hello worldHi there')
	})

	it('discards any partial reply and shows the error card on failure', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		streamAskInto(editor, 1, 'Summarise this note')
		const handlers = ask.mock.calls[0]?.[2]

		handlers.onChunk('Partial reply')
		handlers.onError('Claude CLI not found')

		expect(editor.getText()).toBe('')
		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'error',
			error: 'Claude CLI not found',
		})
	})
})
