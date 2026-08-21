import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { useEffect } from 'react'

import { askProposalPluginKey } from '@/editor/extensions/ask/ask-suggestion-extension'
import { getAskClient } from '@/lib/ask/ask-client'

/**
 * Drives the Claude call behind the bubble menu's ask proposal: starts one
 * whenever the plugin's state (`ask-suggestion-extension.ts`) enters
 * `'streaming'` for a proposal id this hasn't started a request for yet, and
 * feeds chunks back in through the extension's own commands. The extension
 * itself never does I/O - same "React owns the pipeline" split
 * `use-text-tools.ts` uses for the writing-checks worker.
 *
 * Keyed on `proposal?.id` alone, not the whole proposal object, so this only
 * re-runs on a genuinely new proposal (a fresh ask, or a redo) rather than on
 * every streamed chunk - which is also what makes the cleanup below correct:
 * it cancels exactly when the id changes or clears, not on every chunk.
 */
export function useAskProposal(editor: Editor | null) {
	const proposal = useEditorState({
		editor,
		selector: ({ editor }) =>
			editor ? askProposalPluginKey.getState(editor.state) : null,
	})

	useEffect(() => {
		if (!editor || !proposal || proposal.status !== 'streaming') return

		const selectedText = editor.state.doc.textBetween(
			proposal.from,
			proposal.to
		)

		const requestId = getAskClient().ask(proposal.prompt, selectedText, {
			onChunk: (text) =>
				editor.commands.appendAskProposalChunk({ id: proposal.id, text }),
			onDone: () => editor.commands.finishAskProposal({ id: proposal.id }),
			onError: (error) =>
				editor.commands.failAskProposal({ id: proposal.id, error }),
		})

		return () => getAskClient().cancel(requestId)
		// Only the id decides whether a new request is needed - `proposal` itself
		// changes identity on every streamed chunk this same request delivers.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor, proposal?.id])
}
