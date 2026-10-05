import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/react'

import { createAdmonitionHeader } from '#src/editor/extensions/admonition/admonition-header'
import { readAdmonition } from '#src/editor/extensions/admonition/admonition-of'

const admonitionPluginKey = new PluginKey<DecorationSet>('admonition')

function decorate(doc: ProseMirrorNode): DecorationSet {
	const decorations: Decoration[] = []

	doc.descendants((node, pos) => {
		const tag = readAdmonition(node)
		if (!tag) return

		decorations.push(
			Decoration.node(pos, pos + node.nodeSize, {
				class: 'admonition',
				'data-admonition': tag.type,
			}),
			Decoration.widget(pos + 2, () => createAdmonitionHeader(tag.type), {
				side: -1,
				key: `admonition-header-${tag.type}`,
			})
		)
	})

	return DecorationSet.create(doc, decorations)
}

/**
 * Draws a GFM alert - a blockquote whose first line is `> [!TYPE]` - as a
 * colored callout with an icon header. Decorations only: the quote stays an
 * ordinary `blockquote` node, so the saved markdown is exactly what GitHub
 * renders as an alert, and the tag is real text that reveals under the caret
 * (see `admonition-reveal-provider.ts`).
 */
export const Admonition = Extension.create({
	name: 'admonition',

	addProseMirrorPlugins() {
		return [
			new Plugin<DecorationSet>({
				key: admonitionPluginKey,
				state: {
					init: (_config, state) => decorate(state.doc),
					apply: (tr, previous, _oldState, newState) =>
						tr.docChanged ? decorate(newState.doc) : previous,
				},
				props: {
					decorations: (state) => admonitionPluginKey.getState(state),
				},
			}),
		]
	},
})
