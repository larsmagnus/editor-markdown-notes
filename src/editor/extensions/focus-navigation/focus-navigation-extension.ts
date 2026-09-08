import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

import { focusRelativeToDomPoint } from '#src/editor/extensions/focus-navigation/focusable-elements'

/** Held alone, these must never disarm focus-navigation. */
const MODIFIER_KEYS = new Set([
	'Alt',
	'AltGraph',
	'CapsLock',
	'Control',
	'Fn',
	'FnLock',
	'Meta',
	'NumLock',
	'ScrollLock',
	'Shift',
])

/**
 * WCAG 2.1.2 escape hatch: without this, a caret in plain text is a
 * keyboard trap, since `TabIndent` claims every Tab for indentation.
 *
 * Escape arms a one-shot mode; the next Tab/Shift-Tab moves real DOM focus
 * instead of editing, then disarms. Any other key or a click disarms it too.
 *
 * Only the caret's own case - once focus leaves `view.dom`, ProseMirror
 * stops calling `handleKeyDown`, so `use-focus-navigation.ts` takes over
 * with a `document`-level listener.
 *
 * Registered right after `TabIndent`, before `SlashCommand`: last-registered
 * runs first, so this outranks `TabIndent`, the image node's Tab shortcut,
 * and the table's Tab-between-cells keymap, but yields to `SlashCommand`'s
 * own popup.
 */
export const FocusNavigation = Extension.create({
	name: 'focusNavigation',

	addStorage() {
		return { armed: false }
	},

	addProseMirrorPlugins() {
		const storage = this.storage

		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						mousedown: () => {
							storage.armed = false
							return false
						},
					},
					handleKeyDown(view, event) {
						if (event.key === 'Escape') {
							if (view.dom === document.activeElement) storage.armed = true
							return false // A popover or the slash menu may still need it.
						}

						if (event.key !== 'Tab') {
							if (!MODIFIER_KEYS.has(event.key)) storage.armed = false
							return false
						}

						if (view.dom !== document.activeElement || !storage.armed) {
							return false
						}

						storage.armed = false // One-shot.

						const direction = event.shiftKey ? -1 : 1
						const domPoint = view.domAtPos(view.state.selection.$head.pos)
						const moved = focusRelativeToDomPoint(domPoint, direction)
						if (!moved) return false

						event.preventDefault()
						return true
					},
				},
			}),
		]
	},
})

declare module '@tiptap/core' {
	interface Storage {
		focusNavigation: { armed: boolean }
	}
}
