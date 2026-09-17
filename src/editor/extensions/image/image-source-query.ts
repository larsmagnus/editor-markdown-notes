import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorState } from '@tiptap/pm/state'

import type { ImageAttrs } from '#src/editor/extensions/image/image-markdown-text'

/** The `imageSource` node the selection sits inside, and the image node right after it, if any. */
export type ImageSourceMatch = {
	pos: number
	node: ProseMirrorNode
	imagePos: number
	imageNode: ProseMirrorNode | null
}

/** Finds the sole `imageSource` node in `doc`, if one currently exists (at most one, by construction). */
export function findImageSource(doc: ProseMirrorNode): ImageSourceMatch | null {
	let match: ImageSourceMatch | null = null

	doc.descendants((node, pos) => {
		if (match || node.type.name !== 'imageSource') return
		const imagePos = pos + node.nodeSize
		const imageNode = doc.nodeAt(imagePos)
		match = {
			pos,
			node,
			imagePos,
			imageNode: imageNode?.type.name === 'image' ? imageNode : null,
		}
	})

	return match
}

/** Is the caret (an empty selection) inside the given `imageSource` node's text content? */
export function caretInsideSource(
	state: EditorState,
	match: ImageSourceMatch
): boolean {
	const { selection } = state
	return (
		selection.empty &&
		selection.from > match.pos &&
		selection.from < match.pos + match.node.nodeSize
	)
}

/** Does `attrs` already match `imageNode`'s own attrs? */
export function matchesImageAttrs(
	imageNode: ProseMirrorNode,
	attrs: ImageAttrs
): boolean {
	return (
		imageNode.attrs.src === attrs.src &&
		imageNode.attrs.alt === attrs.alt &&
		(imageNode.attrs.title ?? null) === attrs.title
	)
}
