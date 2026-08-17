import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'

import { extensions } from '@/editor/extensions'

import { askProposalPluginKey } from './ask-suggestion-extension'

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

describe('startAskProposal', () => {
	it('sets a streaming proposal with the given range and prompt', () => {
		const editor = newEditor('<p>Hello world</p>')

		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })

		const proposal = askProposalPluginKey.getState(editor.state)
		expect(proposal).toMatchObject({
			from: 1,
			to: 6,
			prompt: 'Shorten this',
			status: 'streaming',
			text: '',
		})
	})
})

describe('appendAskProposalChunk / finishAskProposal', () => {
	it('accumulates chunks, then marks the proposal done', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''

		editor.commands.appendAskProposalChunk({ id, text: 'Hi' })
		editor.commands.appendAskProposalChunk({ id, text: ' there' })
		editor.commands.finishAskProposal({ id })

		expect(askProposalPluginKey.getState(editor.state)).toMatchObject({
			text: 'Hi there',
			status: 'done',
		})
	})

	it('ignores a chunk for an id that is not the current proposal', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })

		const handled = editor.commands.appendAskProposalChunk({
			id: 'stale-id',
			text: 'nope',
		})

		expect(handled).toBe(false)
		expect(askProposalPluginKey.getState(editor.state)?.text).toBe('')
	})
})

describe('failAskProposal', () => {
	it('marks the proposal errored with the given message', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''

		editor.commands.failAskProposal({ id, error: 'Claude CLI not found' })

		expect(askProposalPluginKey.getState(editor.state)).toMatchObject({
			status: 'error',
			error: 'Claude CLI not found',
		})
	})
})

describe('acceptAskProposal', () => {
	it('replaces the original range with the proposed text and clears state', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''
		editor.commands.appendAskProposalChunk({ id, text: 'Hi' })
		editor.commands.finishAskProposal({ id })

		editor.commands.acceptAskProposal({ id })

		expect(editor.getText()).toBe('Hi world')
		expect(askProposalPluginKey.getState(editor.state)).toBeNull()
	})

	it('does nothing while the proposal is still streaming', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''

		const handled = editor.commands.acceptAskProposal({ id })

		expect(handled).toBe(false)
		expect(editor.getText()).toBe('Hello world')
	})
})

describe('declineAskProposal', () => {
	it('clears the proposal without touching document content', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''

		editor.commands.declineAskProposal({ id })

		expect(editor.getText()).toBe('Hello world')
		expect(askProposalPluginKey.getState(editor.state)).toBeNull()
	})
})

describe('closeAskProposal', () => {
	it('keeps the original text and inserts the proposed text as a new paragraph after it', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''
		editor.commands.appendAskProposalChunk({ id, text: 'Hi' })
		editor.commands.finishAskProposal({ id })

		editor.commands.closeAskProposal({ id })

		expect(editor.getText()).toBe('Hello world\n\nHi')
		expect(askProposalPluginKey.getState(editor.state)).toBeNull()
	})

	it('does nothing while the proposal is still streaming', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''

		const handled = editor.commands.closeAskProposal({ id })

		expect(handled).toBe(false)
		expect(editor.getText()).toBe('Hello world')
	})
})

describe('editAskProposalText', () => {
	it('replaces the proposed text once done, and accept uses the edited text', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''
		editor.commands.appendAskProposalChunk({ id, text: 'Hi' })
		editor.commands.finishAskProposal({ id })

		editor.commands.editAskProposalText({ id, text: 'Hiya' })
		editor.commands.acceptAskProposal({ id })

		expect(editor.getText()).toBe('Hiya world')
	})

	it('does nothing while the proposal is still streaming', () => {
		const editor = newEditor('<p>Hello world</p>')
		editor.commands.startAskProposal({ from: 1, to: 6, prompt: 'Shorten this' })
		const id = askProposalPluginKey.getState(editor.state)?.id ?? ''

		const handled = editor.commands.editAskProposalText({ id, text: 'Hiya' })

		expect(handled).toBe(false)
		expect(askProposalPluginKey.getState(editor.state)?.text).toBe('')
	})
})

describe('position mapping', () => {
	it('keeps the proposal anchored to the same text after an edit earlier in the doc', () => {
		const editor = newEditor('<p>Hello world</p>')
		// "world" sits at [7, 12) in "Hello world" (position 1 is the paragraph's
		// first character).
		editor.commands.startAskProposal({
			from: 7,
			to: 12,
			prompt: 'Shorten this',
		})

		editor.chain().insertContentAt(1, 'Well, ').run()

		const proposal = askProposalPluginKey.getState(editor.state)
		expect(proposal).toMatchObject({ from: 13, to: 18 })
		expect(
			editor.state.doc.textBetween(proposal?.from ?? 0, proposal?.to ?? 0)
		).toBe('world')
	})
})
