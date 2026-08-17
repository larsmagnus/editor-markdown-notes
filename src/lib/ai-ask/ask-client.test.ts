import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAskClient } from './ask-client'

function postFromHost(data: unknown) {
	window.dispatchEvent(new MessageEvent('message', { data }))
}

describe('createAskClient', () => {
	beforeEach(() => {
		window.vscode = {
			postMessage: vi.fn(),
			getState: vi.fn(),
			setState: vi.fn(),
		}
	})

	afterEach(() => {
		delete window.vscode
	})

	it('posts askClaude with a generated requestId and the given prompt', () => {
		const client = createAskClient()

		const requestId = client.ask('Shorten this', 'some selected text', {
			onChunk: vi.fn(),
			onDone: vi.fn(),
			onError: vi.fn(),
		})

		expect(window.vscode?.postMessage).toHaveBeenCalledWith({
			type: 'askClaude',
			requestId,
			prompt: 'Shorten this',
			selectedText: 'some selected text',
		})
	})

	it('routes chunks, then done, to the handlers for that requestId only', () => {
		const client = createAskClient()
		const onChunk = vi.fn()
		const onDone = vi.fn()
		const requestId = client.ask('Improve this', undefined, {
			onChunk,
			onDone,
			onError: vi.fn(),
		})

		postFromHost({ type: 'askChunk', requestId: 'unrelated-id', text: 'nope' })
		postFromHost({ type: 'askChunk', requestId, text: 'Hello' })
		postFromHost({ type: 'askChunk', requestId, text: ' world' })
		postFromHost({ type: 'askDone', requestId })

		expect(onChunk).toHaveBeenCalledTimes(2)
		expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello')
		expect(onChunk).toHaveBeenNthCalledWith(2, ' world')
		expect(onDone).toHaveBeenCalledTimes(1)
	})

	it('routes an error to that request only, and stops delivering after it', () => {
		const client = createAskClient()
		const onChunk = vi.fn()
		const onError = vi.fn()
		const requestId = client.ask('Simplify this', undefined, {
			onChunk,
			onDone: vi.fn(),
			onError,
		})

		postFromHost({ type: 'askError', requestId, error: 'Claude CLI not found' })
		postFromHost({ type: 'askChunk', requestId, text: 'too late' })

		expect(onError).toHaveBeenCalledWith('Claude CLI not found')
		expect(onChunk).not.toHaveBeenCalled()
	})

	it('resolves two concurrent requests independently', () => {
		const client = createAskClient()
		const first = { onChunk: vi.fn(), onDone: vi.fn(), onError: vi.fn() }
		const second = { onChunk: vi.fn(), onDone: vi.fn(), onError: vi.fn() }
		const firstId = client.ask('First prompt', undefined, first)
		const secondId = client.ask('Second prompt', undefined, second)

		postFromHost({ type: 'askChunk', requestId: firstId, text: 'first chunk' })
		postFromHost({
			type: 'askChunk',
			requestId: secondId,
			text: 'second chunk',
		})

		expect(first.onChunk).toHaveBeenCalledWith('first chunk')
		expect(first.onChunk).not.toHaveBeenCalledWith('second chunk')
		expect(second.onChunk).toHaveBeenCalledWith('second chunk')
		expect(second.onChunk).not.toHaveBeenCalledWith('first chunk')
	})

	it('cancel posts cancelAsk and stops delivering further chunks for that id', () => {
		const client = createAskClient()
		const onChunk = vi.fn()
		const requestId = client.ask('Shorten this', undefined, {
			onChunk,
			onDone: vi.fn(),
			onError: vi.fn(),
		})

		client.cancel(requestId)
		postFromHost({ type: 'askChunk', requestId, text: 'arrives after cancel' })

		expect(window.vscode?.postMessage).toHaveBeenCalledWith({
			type: 'cancelAsk',
			requestId,
		})
		expect(onChunk).not.toHaveBeenCalled()
	})
})
