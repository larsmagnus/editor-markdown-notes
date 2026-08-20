import type { RawCommands } from '@tiptap/core'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { askProposalPluginKey } from '@/editor/ask/ask-suggestion-extension'
import type { AskProposalState } from '@/editor/ask/ask-suggestion-extension'

/**
 * Looks up the in-flight proposal, gated to the command's own id (a stale
 * command for a since-replaced or closed proposal must be a no-op) and
 * optionally its status.
 */
function currentProposal(
	state: EditorState,
	id: string,
	status?: AskProposalState['status']
): AskProposalState | undefined {
	const current = askProposalPluginKey.getState(state)
	if (!current || current.id !== id) return undefined
	if (status && current.status !== status) return undefined
	return current
}

/** Merges `updates` into the proposal state, for commands that only patch fields. */
function updateProposal(
	dispatch: ((tr: Transaction) => void) | undefined,
	tr: Transaction,
	current: AskProposalState,
	updates: Partial<AskProposalState>
) {
	if (dispatch)
		dispatch(tr.setMeta(askProposalPluginKey, { ...current, ...updates }))
}

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
			const current = currentProposal(state, id)
			if (!current) return false
			updateProposal(dispatch, tr, current, { text: current.text + text })
			return true
		},
	finishAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = currentProposal(state, id)
			if (!current) return false
			updateProposal(dispatch, tr, current, { status: 'done' })
			return true
		},
	failAskProposal:
		({ id, error }: { id: string; error: string }) =>
		({ tr, dispatch, state }) => {
			const current = currentProposal(state, id)
			if (!current) return false
			updateProposal(dispatch, tr, current, { status: 'error', error })
			return true
		},
	acceptAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = currentProposal(state, id, 'done')
			if (!current) return false
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
			const current = currentProposal(state, id)
			if (!current) return false
			if (dispatch) dispatch(tr.setMeta(askProposalPluginKey, null))
			return true
		},
	closeAskProposal:
		({ id }: { id: string }) =>
		({ tr, dispatch, state }) => {
			const current = currentProposal(state, id, 'done')
			if (!current) return false
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
			const current = currentProposal(state, id, 'done')
			if (!current) return false
			updateProposal(dispatch, tr, current, { text })
			return true
		},
}
