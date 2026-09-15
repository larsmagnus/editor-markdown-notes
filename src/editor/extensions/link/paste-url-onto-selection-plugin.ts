import type { MarkType } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'

import { createApplyLinkCommand } from '#src/editor/extensions/link/apply-link-command'
import { looksLikeUrl } from '#src/editor/extensions/link/looks-like-url'

export function createPasteUrlOntoSelectionPlugin(markType: MarkType): Plugin {
	return new Plugin({
		props: {
			handlePaste(view, event) {
				const { selection } = view.state
				if (selection.empty) return false

				const text = event.clipboardData?.getData('text/plain')
				if (!text || !looksLikeUrl(text)) return false

				createApplyLinkCommand(markType, { href: text.trim() })(
					view.state,
					view.dispatch
				)
				return true
			},
		},
	})
}
