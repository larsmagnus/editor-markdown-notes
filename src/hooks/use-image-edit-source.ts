import type { NodeViewProps } from '@tiptap/react'

import { enterImageEditSource } from '#src/editor/extensions/image/edit-source'

/**
 * Opens the "Edit source" flow for this image. Routed through
 * `editor.chain().focus().command(...)` rather than a bare dispatch - see
 * `enterImageEditSource`'s own doc comment for why the ordering matters.
 */
export function useImageEditSource({
	editor,
	getPos,
}: Pick<NodeViewProps, 'editor' | 'getPos'>): () => void {
	return () => {
		const pos = getPos()
		if (pos === undefined) return
		editor
			.chain()
			.focus()
			.command(({ state, dispatch }) =>
				enterImageEditSource(pos)(state, dispatch)
			)
			.run()
	}
}
