import type { ReactNode } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'

/**
 * One persistent React root for a single decoration widget, reused across
 * ProseMirror state reads rather than rebuilt on every one - `render` is
 * called as a side effect of computing `decorations(state)`, not just from a
 * widget's `toDOM` constructor, which is what lets a streamed chunk update
 * the DOM without ProseMirror having to reconstruct the widget itself.
 *
 * Shared by `ask-proposal-widget-mount.ts` and `ask-inline-status-widget-mount.ts` -
 * both hold at most one instance at a time (only one bubble menu, and only
 * one `/ask` command, can be open at once). `tag` decides how the container
 * sits in the surrounding text: `div` (the default) forces a block box, which
 * is what the proposal widget wants underneath a selection; `/ask`'s status
 * widget instead sits mid-paragraph at the cursor, and a `div` there forces an
 * unwanted line break before it, same as any other block element would.
 */
export function createWidgetMount(tag: 'div' | 'span' = 'div') {
	let active: { id: string; container: HTMLElement; root: Root } | null = null

	function unmount() {
		if (!active) return
		active.root.unmount()
		active = null
	}

	function render(id: string, node: ReactNode): HTMLElement {
		if (!active || active.id !== id) {
			unmount()
			const container = document.createElement(tag)
			active = { id, container, root: createRoot(container) }
		}

		active.root.render(node)
		return active.container
	}

	return { render, unmount }
}
