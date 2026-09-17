import type { RawCommands } from '@tiptap/core'

import {
	updateProposal,
	withProposal,
} from '#src/editor/extensions/ask/ask-proposal-command-support'
import { askProposalPluginKey } from '#src/editor/extensions/ask/ask-suggestion-extension'

/**
 * The finished-proposal half of the `askSuggestion` extension's commands -
 * accepting, declining or editing a reply once it's done streaming, as
 * opposed to `ask-proposal-stream-commands.ts`'s in-flight ones. Pulled out of
 * `ask-suggestion-extension.ts` to keep that file's complexity score under
 * the repo's cap. None of them read `this`, so a plain object works as well
 * as a method on the extension.
 */
export const askProposalCommands: Pick<
	RawCommands,
	| 'acceptAskProposal'
	| 'declineAskProposal'
	| 'closeAskProposal'
	| 'editAskProposalText'
> = {
	acceptAskProposal: withProposal(
		'done',
		(current, _args: { id: string }, { tr, dispatch }) => {
			if (dispatch) {
				tr.insertText(current.text, current.from, current.to)
				tr.setMeta(askProposalPluginKey, null)
				dispatch(tr)
			}
			return true
		}
	),
	declineAskProposal: withProposal(
		undefined,
		(_current, _args: { id: string }, { tr, dispatch }) => {
			if (dispatch) dispatch(tr.setMeta(askProposalPluginKey, null))
			return true
		}
	),
	closeAskProposal: withProposal(
		'done',
		(current, _args: { id: string }, { tr, dispatch, state }) => {
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
		}
	),
	editAskProposalText: withProposal(
		'done',
		(current, { text }: { id: string; text: string }, { tr, dispatch }) => {
			updateProposal(dispatch, tr, current, { text })
			return true
		}
	),
}
