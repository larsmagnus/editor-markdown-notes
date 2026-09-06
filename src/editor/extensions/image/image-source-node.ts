import { Node } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'

import type { ImageAttrs } from '@/editor/extensions/image/image-markdown-text'
import { parseImageMarkdown } from '@/editor/extensions/image/image-markdown-text'

/**
 * The image's `![alt](src "title")` while it's being edited - real, editable
 * text rather than content on the image itself, which an atom node has none
 * of to hold it in. Inline, like the image (see `extensions.ts`), so it can
 * sit immediately before it in the same paragraph regardless of whether that
 * image is alone on its own line or mid-sentence. `edit-source.ts`'s
 * `enterImageEditSource` inserts one immediately before the image it belongs
 * to; `sync-image-source-plugin.ts` keeps the image's attrs matching it while
 * the caret is inside, and removes it again once the caret leaves. Never
 * reaches the saved file: its own markdown serializer writes nothing, since
 * the adjacent image node's serializer already emits the real syntax from its
 * attrs - without this, saving mid-edit would write both.
 */
export const ImageSource = Node.create({
	name: 'imageSource',
	group: 'inline',
	inline: true,
	content: 'text*',
	marks: '',
	selectable: false,

	parseHTML() {
		return [{ tag: 'span[data-type="image-source"]' }]
	},

	renderHTML() {
		// Plain inline, not `display: block` - a schema-inline node forced
		// visually onto its own line confuses the browser's own Home/End line-box
		// math, which `caretInsideSource`'s callers lean on to select and clear
		// it. It still tends to wrap onto its own line regardless, since it and
		// the image together usually exceed the paragraph's width.
		return [
			'span',
			{ 'data-type': 'image-source', class: 'font-mono text-xs' },
			0,
		]
	},

	addStorage() {
		return {
			markdown: {
				serialize: () => {},
				parse: {},
			},
		}
	},
})

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

/** Deletes the revealed text, applies `attrs` to the adjacent image (if any), and selects it. */
export function removeSourceNode(
	tr: Transaction,
	match: ImageSourceMatch,
	attrs: ImageAttrs | null
): void {
	tr.delete(match.pos, match.pos + match.node.nodeSize)
	if (!match.imageNode) return

	const imagePos = tr.mapping.map(match.pos)
	if (attrs) tr.setNodeMarkup(imagePos, undefined, attrs)
	tr.setSelection(NodeSelection.create(tr.doc, imagePos))
}

/**
 * Finalizes the revealed text: parses it into the image's attrs, or deletes
 * the image outright if it was cleared. The shared tail of every way of
 * leaving it - `Enter`, arrowing off the end, and (via
 * `sync-image-source-plugin.ts`) every other caret or mouse movement out of
 * the revealed range.
 */
export function finalizeImageSource(
	tr: Transaction,
	match: ImageSourceMatch
): void {
	const text = match.node.textContent

	if (text.trim() === '' && match.imageNode) {
		tr.delete(match.pos, match.pos + match.node.nodeSize)
		const imagePos = tr.mapping.map(match.pos)
		tr.delete(imagePos, imagePos + match.imageNode.nodeSize)
		return
	}

	removeSourceNode(tr, match, parseImageMarkdown(text))
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
