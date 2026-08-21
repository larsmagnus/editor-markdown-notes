import { PluginKey } from '@tiptap/pm/state'

export type AskInlineStatusState =
	| { id: string; pos: number; status: 'loading'; onCancel: () => void }
	| {
			id: string
			pos: number
			status: 'error'
			error: string
			onRetry: () => void
	  }
	| null

export const askInlineStatusPluginKey = new PluginKey<AskInlineStatusState>(
	'askInlineStatus'
)

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		askInlineStatus: {
			startAskLoading: (args: {
				pos: number
				onCancel: () => void
			}) => ReturnType
			showAskInlineError: (args: {
				pos: number
				error: string
				onRetry: () => void
			}) => ReturnType
			stopAskInline: () => ReturnType
		}
	}
}
