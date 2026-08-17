import type { RawCommands } from '@tiptap/core'

import { askProposalPluginKey } from '@/editor/ask-suggestion-extension'
import type { AskProposalState } from '@/editor/ask-suggestion-extension'

/**
 * The `askSuggestion` extension's commands, pulled out of
 * `ask-suggestion-extension.ts` to keep that file's complexity score under
 * the repo's cap. None of them read `this`, so a plain object works as well
 * as a method on the extension.
 */
export const askProposalCommands: Pick<
	RawCommands,
	| 'startAskProposal'
	| 'appendAskProposalChunk'
	| 'finishAskProposal'
	| 'failAskProposal'
	| 'acceptAskProposal'
	| 'declineAskProposal'
	| 'closeAskProposal'
	| 'editAskProposalText'
> = {
	startAskProposal:
		({ from, to, prompt }: { from: number; to: number; prompt: string }) =>
		({ tr, dispatch }) => {
			if (dispatch) {
				const proposal: AskProposalState = {
					id: crypto.randomUUID(),
					from,
					to,
					prompt,
					status: 'streaming',
					text: '',
				}
				dispatch(tr.setMeta(askProposalPluginKey, proposal))
			}
			return true
		},
	appendAskProposalChunk:
		({ id, text }: { id: string; text: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id) return false
			if (dispatch) {
				dispatch(
					tr.setMeta(askProposalPluginKey, {
						...current,
						text: current.text + text,
					})
				)
			}
			return true
		},
	finishAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id) return false
			if (dispatch) {
				dispatch(
					tr.setMeta(askProposalPluginKey, { ...current, status: 'done' })
				)
			}
			return true
		},
	failAskProposal:
		({ id, error }: { id: string; error: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id) return false
			if (dispatch) {
				dispatch(
					tr.setMeta(askProposalPluginKey, {
						...current,
						status: 'error',
						error,
					})
				)
			}
			return true
		},
	acceptAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id || current.status !== 'done')
				return false
			if (dispatch) {
				tr.insertText(current.text, current.from, current.to)
				tr.setMeta(askProposalPluginKey, null)
				dispatch(tr)
			}
			return true
		},
	declineAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id) return false
			if (dispatch) dispatch(tr.setMeta(askProposalPluginKey, null))
			return true
		},
	closeAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id || current.status !== 'done')
				return false
			if (dispatch) {
				const paragraph = state.schema.nodes.paragraph.create(
					undefined,
					current.text ? state.schema.text(current.text) : undefined
				)
				tr.insert(tr.doc.resolve(current.to).after(), paragraph)
				tr.setMeta(askProposalPluginKey, null)
				dispatch(tr)
			}
			return true
		},
	editAskProposalText:
		({ id, text }: { id: string; text: string }) =>
		({ tr, dispatch, state }) => {
			const current = askProposalPluginKey.getState(state)
			if (!current || current.id !== id || current.status !== 'done')
				return false
			if (dispatch) {
				dispatch(tr.setMeta(askProposalPluginKey, { ...current, text }))
			}
			return true
		},
}
