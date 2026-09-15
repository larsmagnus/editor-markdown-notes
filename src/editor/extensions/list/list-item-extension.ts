import type { CommandProps } from '@tiptap/core'
import ListItem from '@tiptap/extension-list-item'
import { Plugin, PluginKey } from '@tiptap/pm/state'

import { withMarkerStrip } from '#src/editor/extensions/block-marker/with-marker-strip'
import { insertLiteralListMarkers } from '#src/editor/extensions/list/insert-literal-list-markers'
import { listItemMarkdownSerialize } from '#src/editor/extensions/list/list-markdown-spec'
import { mergeAdjacentLists } from '#src/editor/extensions/list/merge-adjacent-lists'

/**
 * `listItem` stays real ProseMirror structure (nesting, Enter, Tab all
 * depend on it) - only its own first paragraph's leading marker becomes
 * real text (see `block-marker/`), reconstructed on parse from
 * the `<ul>`/`<ol>` markdown-it's HTML carries no literal marker in at all
 * (`insertLiteralListMarkers`).
 *
 * The sync plugin is registered once here rather than on every list-shaped
 * node - `listItem`/`taskItem` are the nodes it actually inspects, and
 * `bulletList`/`orderedList`/`taskList` never need their own copy of it.
 */
export const ListItemExtension = ListItem.extend({
	addStorage() {
		return {
			markdown: {
				serialize: listItemMarkdownSerialize,
				parse: { updateDOM: insertLiteralListMarkers },
			},
		}
	},

	/**
	 * `bulletList`/`orderedList` own these commands, but neither ships as its
	 * own package here - both come through StarterKit. Redefining them on the
	 * item (registered later, so it wins the merge) over core's `toggleList`
	 * reproduces the stock body exactly, which is all the wrapper needs.
	 */
	addCommands() {
		const toggle = (listName: string) => () => (props: CommandProps) =>
			withMarkerStrip(props, { toggled: listName, marker: this.name }, () =>
				props.commands.toggleList(listName, this.name, true)
			)

		return {
			...this.parent?.(),
			toggleBulletList: toggle('bulletList'),
			toggleOrderedList: toggle('orderedList'),
		}
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('mergeAdjacentLists'),
				appendTransaction: (_transactions, _oldState, newState) =>
					mergeAdjacentLists(newState) ?? undefined,
			}),
		]
	},
})
