import type { RawCommands } from '@tiptap/core'

import {
	updateProposal,
	withProposal,
} from '#src/editor/extensions/ask/ask-proposal-command-support'
import { askProposalPluginKey } from '#src/editor/extensions/ask/ask-suggestion-extension'
import type { AskProposalState } from '#src/editor/extensions/ask/ask-suggestion-extension'

/** The in-flight half of the `askSuggestion` extension's commands - starting
 *  a request and reacting to how it streams in, as opposed to the
 *  `ask-proposal-commands.ts` commands that act on a finished one. */
export const askProposalStreamCommands: Pick<
	RawCommands,
	| 'startAskProposal'
	| 'appendAskProposalChunk'
	| 'finishAskProposal'
	| 'failAskProposal'
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
	appendAskProposalChunk: withProposal(
		undefined,
		(current, { text }: { id: string; text: string }, { tr, dispatch }) => {
			updateProposal(dispatch, tr, current, { text: current.text + text })
			return true
		}
	),
	finishAskProposal: withProposal(
		undefined,
		(current, _args: { id: string }, { tr, dispatch }) => {
			updateProposal(dispatch, tr, current, { status: 'done' })
			return true
		}
	),
	failAskProposal: withProposal(
		undefined,
		(current, { error }: { id: string; error: string }, { tr, dispatch }) => {
			updateProposal(dispatch, tr, current, { status: 'error', error })
			return true
		}
	),
}
