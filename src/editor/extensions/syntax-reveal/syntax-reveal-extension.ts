import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'

import { computeRevealDecorations } from '@/editor/extensions/syntax-reveal/compute-reveal-decorations'
import type { RevealProvider } from '@/editor/extensions/syntax-reveal/reveal-provider'

const syntaxRevealPluginKey = new PluginKey<DecorationSet>('syntaxReveal')

/**
 * Hides markdown syntax characters (fences, delimiters, marker text) that
 * every revealable construct now carries as real document text, except
 * where the caret currently touches them.
 *
 * Deliberately stateless - `decorations(state)` is the plugin's only prop,
 * recomputed from `state.selection` on every read rather than cached via
 * `state.init`/`apply`. That means it has no state of its own to desync
 * across undo/redo: the reveal is always freshly derived from whatever the
 * selection currently is, including right after an undo. Every construct
 * contributes a `RevealProvider` (configured once, in `extensions.ts`)
 * instead of registering its own plugin, so the document is walked once per
 * state read no matter how many constructs are revealable.
 */
export const SyntaxReveal = Extension.create<{ providers: RevealProvider[] }>({
	name: 'syntaxReveal',

	addOptions() {
		return { providers: [] }
	},

	addProseMirrorPlugins() {
		const { providers } = this.options

		return [
			new Plugin({
				key: syntaxRevealPluginKey,
				props: {
					decorations(state) {
						return computeRevealDecorations(
							state.doc,
							state.selection,
							providers
						)
					},
				},
			}),
		]
	},
})
