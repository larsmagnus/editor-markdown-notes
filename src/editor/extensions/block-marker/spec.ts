import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

import type { MarkerMatch } from '@/editor/extensions/block-marker/marker-host'

/**
 * Where a construct's marker text lives: on the matched node itself (a
 * heading), or inside its first paragraph (a list item, a blockquote, neither
 * of which is a textblock).
 */
type MarkerHostKind = 'self' | 'firstParagraph'

/** What a spec needs to decide which marker a node should be carrying. */
type MarkerContext = {
	node: ProseMirrorNode
	parent: ProseMirrorNode | null
	index: number
	/** The host textblock's current text, marker included. */
	text: string
}

/**
 * One construct's leading markdown syntax, as the real editable text it now is.
 */
export type BlockMarkerSpec = {
	nodeTypes: string[]
	markerHost: MarkerHostKind
	/**
	 * How far the caret may sit and still reveal the marker. A heading is one
	 * line, so its whole node reads as the marker's own line; a list item or
	 * blockquote holds continuation lines and nested children far below the
	 * marker, where revealing it would shift text the caret is nowhere near.
	 */
	revealScope: 'node' | 'marker'
	/** How much of `text` is marker, `0` when there is none yet. */
	length(text: string): number
	/**
	 * How much of `text`'s tail is a closing marker, for the constructs that
	 * have one - a code block's or frontmatter block's closing fence.
	 */
	trailingLength?(text: string): number
	/**
	 * The marker this node should be carrying. Returning the text already
	 * present is how a spec says "leave it alone"; returning something else is
	 * how an ordered list renumbers.
	 */
	resolve(context: MarkerContext): string
	/** The same, for the closing marker of a construct that has one. */
	resolveTrailing?(context: MarkerContext): string
	/**
	 * This construct draws something in place of its marker - a list item's
	 * bullet, a task item's checkbox - which has to step aside while the marker
	 * text itself is revealed.
	 */
	drawsMarkerStandIn?: boolean
	/**
	 * The marker one step down from the one `text` currently carries, or `null`
	 * when there is no step left and removing it means removing the construct.
	 * A heading steps down a level at a time; every other construct's marker is
	 * all or nothing.
	 */
	demote(text: string): string | null
	/**
	 * Takes the construct apart, leaving its content as ordinary blocks. Runs
	 * against a transaction rather than the editor so the repair pass and the
	 * Backspace handler can share one implementation - the two used to differ,
	 * and the repair pass could only reach the editor by not being one.
	 */
	unwrap(tr: Transaction, match: MarkerMatch): void
}
