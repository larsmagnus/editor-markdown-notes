import type { Editor, Range } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'

import { openAskPromptPopup } from '@/editor/extensions/slash-command/ask-prompt-render'
import { getAskClient } from '@/lib/ask/ask-client'

/**
 * The slash command's "ask" action: deletes the typed `/ask` text (like every
 * other command), then opens a free-text prompt box at the cursor rather than
 * running immediately - unlike the rest of `SLASH_COMMANDS`, this one needs
 * more input before it has anything to do.
 *
 * Writes the reply directly into the document as it streams, with no
 * accept/decline step - unlike the bubble menu's proposal flow, this
 * command's whole point is "handles the result inline, writes response out".
 * A failed request is the one exception: it shows an `ErrorFallback` card
 * with retry/dismiss rather than leaving broken text in the note.
 */
export function runAskCommand(editor: Editor, range: Range) {
	editor.chain().focus().deleteRange(range).run()
	const pos = range.from

	// `Suggestion` refocuses the editor view as part of its own exit teardown
	// after this command returns, which would otherwise blur the prompt box's
	// textarea the instant it focuses itself - and `AskPromptInput` treats a
	// blur as "cancel". Opening one tick later lets that teardown finish first.
	setTimeout(() => {
		openAskPromptPopup(editor, pos, (prompt) => {
			streamAskInto(editor, pos, prompt)
		})
	}, 0)
}

export function streamAskInto(editor: Editor, pos: number, prompt: string) {
	// Re-entered by the error card's "Try again", which is why the whole
	// request lives in a named closure rather than running inline.
	const run = () => {
		let from = pos
		let to = pos

		// Keeps `from`/`to` correct across every transaction for as long as this
		// request is in flight - not just our own streamed inserts below, but any
		// edit the user makes elsewhere in the document while it streams, or
		// before "Try again" re-runs this closure. `from` holds its ground when
		// something is inserted exactly there (bias -1); `to` grows to include
		// it (bias 1) - together that's "a range anchored at its start, growing
		// at its end", which is exactly how the streamed reply should behave.
		const onTransaction = ({ transaction }: { transaction: Transaction }) => {
			from = transaction.mapping.map(from, -1)
			to = transaction.mapping.map(to, 1)
		}
		editor.on('transaction', onTransaction)
		const stopTracking = () => editor.off('transaction', onTransaction)

		// A JSON text node, not a markdown/HTML string - `insertContentAt` parses
		// a string as HTML by default, which would mangle a reply containing `<` or `&`.
		const insertAt = (rangeFrom: number, rangeTo: number, text: string) =>
			editor
				.chain()
				.insertContentAt(
					{ from: rangeFrom, to: rangeTo },
					{ type: 'text', text }
				)
				.run()

		// A spinner widget rather than inserted placeholder text
		// (`ask-inline-status-extension.ts`) while nothing has come back yet -
		// cleared the instant the first chunk arrives, since that replaces it
		// with real streamed content at the same position.
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
				// Only the new text is inserted, at the advancing end of the range -
				// re-inserting everything streamed so far on every chunk would cost
				// O(reply length squared) by the last chunk of a long reply.
				insertAt(to, to, text)
			},
			onDone: () => stopTracking(),
			onError: (error) => {
				clearLoading()
				// Discard any partial reply already streamed in - the error card
				// offers a clean retry rather than leaving a half-written answer
				// behind for the user to notice and clean up themselves.
				insertAt(from, to, '')
				stopTracking()
				editor.commands.showAskInlineError({ pos, error, onRetry: run })
			},
		})
	}

	run()
}
