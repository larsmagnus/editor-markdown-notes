import type { Editor, Range } from '@tiptap/core'

import { openAskPromptPopup } from '#src/editor/extensions/slash-command/ask-prompt-render'
import { streamAskInto } from '#src/editor/extensions/slash-command/ask-stream-reply'

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
