import type { RawCommands } from '@tiptap/core'

import { askInlineStatusPluginKey } from '@/editor/ask/ask-inline-status-state'

/**
 * The `askInlineStatus` extension's commands, pulled out of
 * `ask-inline-status-extension.ts` to keep that file's complexity score under
 * the repo's cap. None of them read `this`, so a plain object works as well
 * as a method on the extension.
 */
export const askInlineStatusCommands: Pick<
	RawCommands,
	'startAskLoading' | 'showAskInlineError' | 'stopAskInline'
> = {
	startAskLoading:
		({ pos, onCancel }: { pos: number; onCancel: () => void }) =>
		({ tr, dispatch }) => {
			if (dispatch) {
				dispatch(
					tr.setMeta(askInlineStatusPluginKey, {
						id: crypto.randomUUID(),
						pos,
						status: 'loading',
						onCancel,
					})
				)
			}
			return true
		},
	showAskInlineError:
		({
			pos,
			error,
			onRetry,
		}: {
			pos: number
			error: string
			onRetry: () => void
		}) =>
		({ tr, dispatch }) => {
			if (dispatch) {
				dispatch(
					tr.setMeta(askInlineStatusPluginKey, {
						id: crypto.randomUUID(),
						pos,
						status: 'error',
						error,
						onRetry,
					})
				)
			}
			return true
		},
	stopAskInline:
		() =>
		({ tr, dispatch }) => {
			if (dispatch) dispatch(tr.setMeta(askInlineStatusPluginKey, null))
			return true
		},
}
