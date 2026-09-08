import { Plugin, PluginKey } from '@tiptap/pm/state'

import { insertLiteralBlockquoteMarker } from '#src/editor/extensions/blockquote/insert-literal-blockquote-marker'
import { insertLiteralHeadingMarkers } from '#src/editor/extensions/heading/insert-literal-heading-markers'
import { insertLiteralRules } from '#src/editor/extensions/horizontal-rule/horizontal-rule-marker'
import {
	insertLiteralListMarkers,
	insertLiteralTaskMarkers,
} from '#src/editor/extensions/list/insert-literal-list-markers'

const INSERTERS = [
	insertLiteralHeadingMarkers,
	insertLiteralListMarkers,
	insertLiteralTaskMarkers,
	insertLiteralBlockquoteMarker,
	insertLiteralRules,
]

/**
 * Reinstates literal marker text in HTML pasted from outside the editor.
 *
 * `updateDOM` covers markdown arriving through markdown-it, but browser HTML
 * reaches `parseHTML` directly, where this schema's `h1`-`h6` rules all produce
 * the same attribute-less `heading`. Without the marker, the repair pass has
 * nothing to go on and gives every level `# `. A rule fares worse still: an
 * `hr` is void, so the node arrives with no text, and a rule that is nothing
 * but its own text reads as unparseable and comes apart on arrival.
 *
 * Only for HTML from elsewhere. ProseMirror stamps its own clipboard slices
 * with `data-pm-slice`, and those already carry every marker as real text -
 * this schema is what put it there. Reinstating one on top turns a copied
 * `## Heading` into `## ## Heading` and a `> Quoted` into `> > &gt; Quoted`,
 * both of which reach the file.
 *
 * Reuses each construct's own inserter, keeping the tag-to-marker mapping in
 * one place rather than written a second time for paste.
 */
export function createPasteLiteralMarkersPlugin(): Plugin {
	return new Plugin({
		key: new PluginKey('pasteLiteralMarkers'),
		props: {
			transformPastedHTML(html: string) {
				if (html.includes('data-pm-slice')) return html

				const container = document.createElement('div')
				container.innerHTML = html
				for (const insert of INSERTERS) insert(container)
				return container.innerHTML
			},
		},
	})
}
