import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

import { liveTextModel } from '#src/lib/mode-switch/live-text-model'
import type { LiveTextModel } from '#src/lib/mode-switch/live-text-model'
import type { ModeView } from '#src/lib/mode-switch/mode-view'

/** The live editor as a `ModeView`. */
export function createLiveModeView(editor: Editor): ModeView {
	const { view } = editor
	let cached: { doc: ProseMirrorNode; model: LiveTextModel } | null = null

	// Rebuilt only when the document changes - a settling switch asks on every
	// tick, and flattening a long note each time is wasted work.
	const model = () => {
		const { doc } = view.state
		if (cached?.doc !== doc) cached = { doc, model: liveTextModel(doc) }
		return cached.model
	}

	return {
		root: view.dom,
		text: () => model().text,
		selection: () => {
			const { anchor, head } = view.state.selection
			return {
				anchor: model().posToOffset(anchor),
				head: model().posToOffset(head),
			}
		},
		setSelection: ({ anchor, head }) => {
			if (editor.isDestroyed) return

			const { doc, tr } = view.state
			const selection = TextSelection.create(
				doc,
				model().offsetToPos(anchor),
				model().offsetToPos(head)
			)
			if (selection.eq(view.state.selection)) return

			view.dispatch(tr.setSelection(selection).setMeta('addToHistory', false))
		},
		hasFocus: () => view.hasFocus(),
		focus: () => {
			if (!editor.isDestroyed) view.focus()
		},
		offsetRect: (offset) => {
			if (editor.isDestroyed) return null

			const rect = caretRect(editor, model().offsetToPos(offset))
			return rect && rect.height > 0 ? rect : null
		},
		offsetAtY: (y) => {
			if (editor.isDestroyed) return null

			// Down the middle of the text column: its left edge can sit in
			// padding outside the editor, where nothing has a position.
			const { left, width } = view.dom.getBoundingClientRect()
			const found = view.posAtCoords({ left: left + width / 2, top: y })
			return found ? model().posToOffset(found.pos) : null
		},
	}
}

/** `coordsAtPos` as a `DOMRect`, or `null` where it cannot measure. */
function caretRect(editor: Editor, pos: number): DOMRect | null {
	try {
		const { left, top, bottom } = editor.view.coordsAtPos(pos)
		return new DOMRect(left, top, 0, bottom - top)
	} catch {
		return null
	}
}
