import { Extension } from '@tiptap/core'

import { askInlineStatusCommands } from '@/editor/ask-inline-status-commands'
import { createAskInlineStatusPlugin } from '@/editor/ask-inline-status-plugin'
import { unmountActiveInlineStatusWidget } from '@/editor/ask-inline-status-widget-mount'

export { askInlineStatusPluginKey } from '@/editor/ask-inline-status-state'

/**
 * The `/ask` slash command's status at the cursor: a spinner while it waits
 * for the first streamed chunk back, or - if the request fails - a card with
 * the same "Try again" / dismiss shape as any other `ErrorFallback` in the
 * app. `ask-command.ts` drives both: it starts the spinner right after
 * deleting the typed `/ask` text, clears it once real content starts
 * streaming in, and switches to the error card (discarding any partial reply
 * first) if the request fails instead. "Try again" re-runs the same prompt;
 * dismissing just clears the state, leaving nothing behind.
 *
 * Kept separate from `ask-suggestion-extension.ts`'s proposal state: this one
 * never touches document content itself (the reply is written directly by
 * `ask-command.ts`, not held here) and has no accept/decline step.
 */
export const AskInlineStatus = Extension.create({
	name: 'askInlineStatus',

	addCommands() {
		return askInlineStatusCommands
	},

	addProseMirrorPlugins() {
		return [createAskInlineStatusPlugin(this.editor)]
	},

	onDestroy() {
		unmountActiveInlineStatusWidget()
	},
})
