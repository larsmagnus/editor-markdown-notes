import type { Editor, Range } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'

import { openAskPromptPopup } from '@/editor/extensions/slash-command/ask-prompt-render'
import { getAskClient } from '@/lib/ask/ask-client'

/**
 * Opens a free-text prompt box at the cursor rather than running immediately,
 * this being the one slash command that needs more input first. The reply
 * streams straight into the document with no accept/decline step; a failed
 * request shows a retry card instead of leaving broken text in the note.
 */
export function runAskCommand(editor: Editor, range: Range) {
	editor.chain().focus().deleteRange(range).run()
	const pos = range.from

	// `Suggestion` refocuses the view during its exit teardown, which would blur
	// the prompt box the instant it focuses - and a blur reads as "cancel".
	setTimeout(() => {
		openAskPromptPopup(editor, pos, (prompt) => {
			streamAskInto(editor, pos, prompt)
		})
	}, 0)
}

/** Streams a reply into the document at `pos`, retryable from the error card. */
export function streamAskInto(editor: Editor, pos: number, prompt: string) {
	const run = () => {
		let from = pos
		let to = pos

		// Keeps the range correct across any edit made while the request is in
		// flight. The biases make it anchored at its start and growing at its end.
		const onTransaction = ({ transaction }: { transaction: Transaction }) => {
			from = transaction.mapping.map(from, -1)
			to = transaction.mapping.map(to, 1)
		}
		editor.on('transaction', onTransaction)
		const stopTracking = () => editor.off('transaction', onTransaction)

		// A JSON text node: `insertContentAt` parses a string as HTML, which would
		// mangle a reply containing `<` or `&`.
		const insertAt = (rangeFrom: number, rangeTo: number, text: string) =>
			editor
				.chain()
				.insertContentAt(
					{ from: rangeFrom, to: rangeTo },
					{ type: 'text', text }
				)
				.run()

		// A spinner widget rather than placeholder text, cleared by the first chunk.
		let requestId: string | undefined
		let loadingCleared = false
		const clearLoading = () => {
			if (loadingCleared) return
			loadingCleared = true
			editor.commands.stopAskInline()
		}

		editor.commands.startAskLoading({
			pos,
			onCancel: () => {
				stopTracking()
				if (requestId) getAskClient().cancel(requestId)
			},
		})

		requestId = getAskClient().ask(prompt, undefined, {
			onChunk: (text) => {
				clearLoading()
				// Only the new text: re-inserting the whole reply per chunk would cost
				// O(length squared) by the end of a long one.
				insertAt(to, to, text)
			},
			onDone: () => stopTracking(),
			onError: (error) => {
				clearLoading()
				// Discard the partial reply, so the retry starts clean.
				insertAt(from, to, '')
				stopTracking()
				editor.commands.showAskInlineError({ pos, error, onRetry: run })
			},
		})
	}

	run()
}
