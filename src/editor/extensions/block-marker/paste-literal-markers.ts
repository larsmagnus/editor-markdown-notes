import { Plugin, PluginKey } from '@tiptap/pm/state'

import { insertLiteralBlockquoteMarker } from '@/editor/extensions/blockquote/insert-literal-blockquote-marker'
import { insertLiteralHeadingMarkers } from '@/editor/extensions/heading/insert-literal-heading-markers'
import {
	insertLiteralListMarkers,
	insertLiteralTaskMarkers,
} from '@/editor/extensions/list/insert-literal-list-markers'

const INSERTERS = [
	insertLiteralHeadingMarkers,
	insertLiteralListMarkers,
	insertLiteralTaskMarkers,
	insertLiteralBlockquoteMarker,
]

/**
 * Reinstates literal marker text in HTML pasted from outside the editor.
 *
 * `updateDOM` covers markdown arriving through markdown-it, but browser HTML
 * reaches `parseHTML` directly, where this schema's `h1`-`h6` rules all produce
 * the same attribute-less `heading`. Without the marker, the repair pass has
 * nothing to go on and gives every level `# `.
 *
 * Reuses each construct's own inserter, keeping the tag-to-marker mapping in
 * one place rather than written a second time for paste.
 */
export function createPasteLiteralMarkersPlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('pasteLiteralMarkers'),
		props: {
			transformPastedHTML(html: string) {
				const container = document.createElement('div')
				container.innerHTML = html
				for (const insert of INSERTERS) insert(container)
				return container.innerHTML
			},
		},
	})
}
