import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { extensions } from '@/editor/extensions'

import { askInlineStatusPluginKey } from './ask-inline-status-extension'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

function newEditor(content: string) {
	const editor = new Editor({ extensions, content })
	currentEditor = editor
	return editor
}

describe('startAskLoading / stopAskInline', () => {
	it('sets loading state at the given position, holding the cancel callback', () => {
		const editor = newEditor('<p>Hello world</p>')
		const onCancel = vi.fn()

		editor.commands.startAskLoading({ pos: 3, onCancel })

		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'loading',
			pos: 3,
			onCancel,
		})
	})

	it('clears the state', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskLoading({ pos: 3, onCancel: vi.fn() })

		editor.commands.stopAskInline()

		expect(askInlineStatusPluginKey.getState(editor.state)).toBeNull()
	})
})

describe('showAskInlineError', () => {
	it('sets error state at the given position, holding the retry callback', () => {
		const editor = newEditor('<p>Hello world</p>')
		const onRetry = vi.fn()

		editor.commands.showAskInlineError({
			pos: 3,
			error: 'Claude CLI not found',
			onRetry,
		})

		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'error',
			pos: 3,
			error: 'Claude CLI not found',
			onRetry,
		})
	})

	it('replaces a loading state outright, rather than requiring it be stopped first', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskLoading({ pos: 3, onCancel: vi.fn() })

		editor.commands.showAskInlineError({
			pos: 3,
			error: 'Claude CLI not found',
			onRetry: vi.fn(),
		})

		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			status: 'error',
		})
	})
})

describe('position mapping', () => {
	it('keeps the loading widget anchored after an edit earlier in the doc', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskLoading({ pos: 7, onCancel: vi.fn() })

		editor.chain().insertContentAt(1, 'Well, ').run()

		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			pos: 13,
		})
	})

	it('keeps the error card anchored after an edit earlier in the doc', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.showAskInlineError({
			pos: 7,
			error: 'Claude CLI not found',
			onRetry: vi.fn(),
		})

		editor.chain().insertContentAt(1, 'Well, ').run()

		expect(askInlineStatusPluginKey.getState(editor.state)).toMatchObject({
			pos: 13,
		})
	})
})
