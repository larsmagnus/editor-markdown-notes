import ListItem from '@tiptap/extension-list-item'

import { insertLiteralListMarkers } from '@/editor/extensions/list/insert-literal-list-markers'
import { listItemMarkdownSerialize } from '@/editor/extensions/list/list-markdown-spec'
import { createListMarkerSyncPlugin } from '@/editor/extensions/list/list-marker-sync-plugin'

/**
 * `listItem` stays real ProseMirror structure (nesting, Enter, Tab all
 * depend on it) - only its own first paragraph's leading marker becomes
 * real text (see `list-marker-sync-plugin.ts`), reconstructed on parse from
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

	addProseMirrorPlugins() {
		return [
			...(this.parent?.() ?? []),
			createListMarkerSyncPlugin(this.editor.schema),
		]
	},
})
