import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

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
	 * The marker this node should be carrying. Returning the text already
	 * present is how a spec says "leave it alone"; returning something else is
	 * how an ordered list renumbers.
	 */
	resolve(context: MarkerContext): string
	/**
	 * Lifts the caret's block out of the construct, so Backspace against the
	 * marker leaves it rather than deleting into it. Omitted by constructs with
	 * no marker text to protect a caret from, which is every one whose marker
	 * hosts itself.
	 */
	exit?(editor: Editor, nodeTypeName: string): boolean
}
