import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorState } from '@tiptap/pm/state'
import { DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'

import {
	computeRevealDecorations,
	revealKey,
} from '@/editor/extensions/syntax-reveal/compute-reveal-decorations'
import type { RevealProvider } from '@/editor/extensions/syntax-reveal/reveal-provider'

/** The decorations in force, and the state they were derived from. */
type RevealState = { set: DecorationSet; key: string }

const syntaxRevealPluginKey = new PluginKey<RevealState>('syntaxReveal')

/**
 * Hides markdown syntax characters (fences, delimiters, marker text) that
 * every revealable construct now carries as real document text, except where
 * the caret currently touches them. Every construct contributes a
 * `RevealProvider` (configured once, in `extensions.ts`) instead of
 * registering its own plugin, so one document walk serves all of them.
 *
 * The decorations are carried in plugin state and mapped through each
 * transaction rather than rebuilt from the new state. Rebuilding is cheap; a
 * *new* set is not, because it makes ProseMirror re-diff every decoration in
 * it against the rendered document, which on a long note costs more than
 * everything else a keystroke does. The state cannot drift from the document
 * the way a cache normally can: `revealKey` re-derives what should be hidden
 * on every transaction, undo and redo included, and any disagreement rebuilds.
 */
export const SyntaxReveal = Extension.create<{ providers: RevealProvider[] }>({
	name: 'syntaxReveal',

	addOptions() {
		return { providers: [] }
	},

	addProseMirrorPlugins() {
		const { providers } = this.options

		const derive = (state: EditorState): RevealState => ({
			set: computeRevealDecorations(state.doc, state.selection, providers),
			key: revealKey(state.doc, state.selection, providers),
		})

		return [
			new Plugin<RevealState>({
				key: syntaxRevealPluginKey,
				state: {
					init: (_config, state) => derive(state),
					apply: (tr, previous, _oldState, newState) => {
						const key = revealKey(newState.doc, newState.selection, providers)
						if (key !== previous.key) return derive(newState)
						if (!tr.docChanged) return previous
						return { set: previous.set.map(tr.mapping, tr.doc), key }
					},
				},
				props: {
					decorations(state) {
						return syntaxRevealPluginKey.getState(state)?.set
					},
				},
			}),
		]
	},
})
