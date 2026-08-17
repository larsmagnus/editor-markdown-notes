import type { Editor } from '@tiptap/core'

import {
	renderWidget,
	unmountActiveWidget,
} from '@/editor/ask-proposal-widget-mount'
import { askProposalPluginKey } from '@/editor/ask-suggestion-extension'
import { createSingleWidgetDecorationPlugin } from '@/editor/single-widget-decoration-plugin'

/**
 * The `askSuggestion` extension's ProseMirror plugin, pulled out of
 * `ask-suggestion-extension.ts` to keep that file's complexity score under
 * the repo's cap - renders whatever proposal state it is handed
 * (`ask-proposal-widget-mount.ts`) and re-maps `from`/`to` through every
 * transaction so it stays anchored while streaming. `to` maps with bias -1
 * so a doc-changing edit right at the boundary doesn't pull the proposal's
 * end past what it originally covered.
 */
export function createAskProposalPlugin(editor: Editor) {
	return createSingleWidgetDecorationPlugin(editor, {
		key: askProposalPluginKey,
		mapPosition: (current, tr) => ({
			...current,
			from: tr.mapping.map(current.from),
			to: tr.mapping.map(current.to, -1),
		}),
		widgetPosition: (current) => current.to,
		render: renderWidget,
		unmount: unmountActiveWidget,
	})
}
