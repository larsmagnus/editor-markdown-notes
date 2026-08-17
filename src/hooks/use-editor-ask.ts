import { useCurrentEditor } from '@tiptap/react'

/**
 * Starts an ask proposal for the current selection - the popover's whole
 * involvement. Everything past that (the actual Claude call, streaming,
 * accept/decline/redo) lives in `ask-suggestion-extension.ts` and
 * `use-ask-proposal.ts`, so the proposal survives the popover closing.
 */
export function useEditorAsk() {
	const { editor } = useCurrentEditor()

	const ask = (prompt: string) => {
		if (!editor) return
		const { from, to } = editor.state.selection
		editor.commands.startAskProposal({ from, to, prompt })
	}

	return { ask }
}
