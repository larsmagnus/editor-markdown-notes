import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { NodeView } from '@tiptap/pm/view'

import { parseHeadingLevel } from '@/editor/extensions/heading/heading-marker'

/**
 * A hand-rolled `NodeView`, not a React one - all it needs to do is swap its
 * own outer tag (`h1`-`h6`) when the leading marker's level changes, and
 * ProseMirror's default node rendering can't: with `level` no longer an
 * attribute (see `heading-extension.ts`), a heading's rendered tag depends
 * only on its *content*, and the default view only rebuilds a node's DOM
 * when its type or attrs change, never its text - so retyping `#` into `##`
 * would otherwise leave the DOM stuck on `<h1>` forever. `update` returning
 * `false` on a level change is what tells ProseMirror to discard this view
 * and build a fresh one (with the correct tag) instead of trying to patch
 * the existing element in place.
 */
export function createHeadingNodeView(node: ProseMirrorNode): NodeView {
	const level = parseHeadingLevel(node.textContent)
	const dom = document.createElement(`h${level}`)

	return {
		dom,
		contentDOM: dom,
		update: (updatedNode) =>
			parseHeadingLevel(updatedNode.textContent) === level,
	}
}
