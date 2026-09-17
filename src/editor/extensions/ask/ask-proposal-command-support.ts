import type { CommandProps } from '@tiptap/core'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { askProposalPluginKey } from '#src/editor/extensions/ask/ask-suggestion-extension'
import type { AskProposalState } from '#src/editor/extensions/ask/ask-suggestion-extension'

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
export function updateProposal(
	dispatch: ((tr: Transaction) => void) | undefined,
	tr: Transaction,
	current: AskProposalState,
	updates: Partial<AskProposalState>
) {
	if (dispatch)
		dispatch(tr.setMeta(askProposalPluginKey, { ...current, ...updates }))
}

/**
 * Every proposal command but `startAskProposal` begins the same way: look up
 * the in-flight proposal gated by id and (for the "done"-only commands)
 * status, bailing out as a no-op if it's gone. Factored out so that guard is
 * written once instead of once per command.
 */
export function withProposal<Args extends { id: string }>(
	status: AskProposalState['status'] | undefined,
	run: (current: AskProposalState, args: Args, props: CommandProps) => boolean
) {
	return (args: Args) => (props: CommandProps) => {
		const current = currentProposal(props.state, args.id, status)
		if (!current) return false
		return run(current, args, props)
	}
}
