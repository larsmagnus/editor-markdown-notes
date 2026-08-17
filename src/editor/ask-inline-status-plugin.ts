import type { Editor } from '@tiptap/core'

import type { AskInlineStatusState } from '@/editor/ask-inline-status-state'
import { askInlineStatusPluginKey } from '@/editor/ask-inline-status-state'
import {
	renderErrorWidget,
	renderLoadingWidget,
	unmountActiveInlineStatusWidget,
} from '@/editor/ask-inline-status-widget-mount'
import { createSingleWidgetDecorationPlugin } from '@/editor/single-widget-decoration-plugin'

function widgetFor(current: NonNullable<AskInlineStatusState>, editor: Editor) {
	if (current.status === 'loading') {
		return renderLoadingWidget(current.id, () => {
			current.onCancel()
			editor.commands.stopAskInline()
		})
	}

	return renderErrorWidget(current.id, current.error, current.onRetry, () =>
		editor.commands.stopAskInline()
	)
}

/**
 * The `askInlineStatus` extension's ProseMirror plugin, pulled out of
 * `ask-inline-status-extension.ts` to keep that file's complexity score under
 * the repo's cap - renders whatever status it is handed
 * (`ask-inline-status-widget-mount.ts`) and re-maps its position through
 * every transaction so it stays anchored at the cursor.
 */
export function createAskInlineStatusPlugin(editor: Editor) {
	return createSingleWidgetDecorationPlugin(editor, {
		key: askInlineStatusPluginKey,
		mapPosition: (current, tr) => ({
			...current,
			pos: tr.mapping.map(current.pos),
		}),
		widgetPosition: (current) => current.pos,
		render: widgetFor,
		unmount: unmountActiveInlineStatusWidget,
	})
}
