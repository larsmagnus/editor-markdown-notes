import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'

import { askProposalCommands } from '@/editor/ask-proposal-commands'
import { createAskProposalPlugin } from '@/editor/ask-proposal-plugin'
import { unmountActiveWidget } from '@/editor/ask-proposal-widget-mount'

type AskProposalStatus = 'streaming' | 'done' | 'error'

export type AskProposalState = {
	id: string
	from: number
	to: number
	prompt: string
	status: AskProposalStatus
	text: string
	error?: string
}

export const askProposalPluginKey = new PluginKey<AskProposalState | null>(
	'askProposal'
)

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		askProposal: {
			startAskProposal: (args: {
				from: number
				to: number
				prompt: string
			}) => ReturnType
			appendAskProposalChunk: (args: { id: string; text: string }) => ReturnType
			finishAskProposal: (args: { id: string }) => ReturnType
			failAskProposal: (args: { id: string; error: string }) => ReturnType
			acceptAskProposal: (args: { id: string }) => ReturnType
			declineAskProposal: (args: { id: string }) => ReturnType
			closeAskProposal: (args: { id: string }) => ReturnType
			editAskProposalText: (args: { id: string; text: string }) => ReturnType
		}
	}
}

/**
 * Proposes a rewrite of a selection under it, with accept/decline/redo - the
 * bubble menu's sparkles popover starts one, `use-ask-proposal.ts` drives the
 * actual Claude call, this extension only renders whatever state it is
 * handed (`ask-proposal-widget-mount.ts`) and owns the commands that move it
 * between states (`ask-proposal-commands.ts`). Same "React owns the pipeline,
 * the extension is dumb" split `text-tools-extension.ts` uses for its
 * decorations.
 *
 * Holds a single nullable proposal rather than a set of many: only one bubble
 * menu can be open at a time, so only one proposal ever exists.
 *
 * `from`/`to` are re-mapped through every transaction so the proposal stays
 * anchored to the right text even if the document changes elsewhere while it
 * streams. Only two commands touch real content: `acceptAskProposal`
 * replaces it, `closeAskProposal` leaves it alone and inserts the proposed
 * text as a new paragraph right after - keeping both versions in the
 * document for the user to reconcile by hand. `editAskProposalText` lets the
 * user adjust the proposed text itself before either of those - the reply is
 * a starting point, not a fait accompli.
 */
export const AskSuggestion = Extension.create({
	name: 'askSuggestion',

	addCommands() {
		return askProposalCommands
	},

	addProseMirrorPlugins() {
		return [createAskProposalPlugin(this.editor)]
	},

	onDestroy() {
		unmountActiveWidget()
	},
})
