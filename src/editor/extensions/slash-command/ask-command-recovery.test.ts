import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { askInlineStatusPluginKey } from '@/editor/extensions/ask/ask-inline-status-extension'
import { extensions } from '@/editor/extensions/extensions'
import { streamAskInto } from '@/editor/extensions/slash-command/ask-command'

const ask = vi.hoisted(() => vi.fn())
const cancel = vi.hoisted(() => vi.fn())
vi.mock('@/lib/ask/ask-client', () => ({
	getAskClient: () => ({ ask, cancel }),
}))

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
	vi.clearAllMocks()
})

describe('the error card', () => {
	it('re-runs the same prompt from the same position on retry', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		streamAskInto(editor, 1, 'Summarise this note')
		ask.mock.calls[0]?.[2].onError('Claude CLI not found')

		const errorState = askInlineStatusPluginKey.getState(editor.state)
		if (errorState?.status !== 'error') throw new Error('expected error state')
		errorState.onRetry()

		expect(ask).toHaveBeenCalledTimes(2)
		expect(ask.mock.calls[1]?.[0]).toBe('Summarise this note')
		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'loading',
			pos: 1,
		})
	})

	it('leaves nothing behind when dismissed', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor

		streamAskInto(editor, 1, 'Summarise this note')
		ask.mock.calls[0]?.[2].onError('Claude CLI not found')

		editor.commands.stopAskInline()

		expect(editor.getText()).toBe('')
		expect(askInlineStatusPluginKey.getState(editor.state)).toBeNull()
	})
})

describe('the loading widget', () => {
	it('cancels the in-flight request when removed', () => {
		const editor = new Editor({ extensions, content: '' })
		currentEditor = editor
		ask.mockReturnValueOnce('request-1')

		streamAskInto(editor, 1, 'Summarise this note')

		const loading = askInlineStatusPluginKey.getState(editor.state)
		if (loading?.status !== 'loading') throw new Error('expected loading state')
		loading.onCancel()

		expect(cancel).toHaveBeenCalledWith('request-1')
	})
})
