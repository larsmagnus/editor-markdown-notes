import { afterEach, describe, expect, it, vi } from 'vitest'

import { askInlineStatusPluginKey } from '#src/editor/extensions/ask/ask-inline-status-extension'
import { streamAskInto } from '#src/editor/extensions/slash-command/ask-stream-reply'
import { createEditor } from '#src/test-utils/editor'

const ask = vi.hoisted(() => vi.fn())
const cancel = vi.hoisted(() => vi.fn())
vi.mock('#src/lib/ask/ask-client', () => ({
	getAskClient: () => ({ ask, cancel }),
}))

afterEach(() => {
	vi.clearAllMocks()
})

describe('streamAskInto', () => {
	it('shows the loading widget immediately, before any reply arrives', () => {
		const editor = createEditor()

		streamAskInto(editor, 1, 'Summarise this note')

		expect(editor.getText()).toBe('')
		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'loading',
			pos: 1,
		})
	})

	it('clears the loading widget and inserts each streamed chunk, cumulatively', () => {
		const editor = createEditor()

		streamAskInto(editor, 1, 'Summarise this note')
		const handlers = ask.mock.calls[0]?.[2]

		handlers.onChunk('Hello')
		expect(editor.getText()).toBe('Hello')
		expect(askInlineStatusPluginKey.getState(editor.state)).toBeNull()

		handlers.onChunk(' world')
		expect(editor.getText()).toBe('Hello world')
	})

	it('keeps inserting streamed chunks in the right place after an edit earlier in the doc', () => {
		const editor = createEditor('<p>Hello world</p>', { parseOnly: true })

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
		const editor = createEditor()

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
