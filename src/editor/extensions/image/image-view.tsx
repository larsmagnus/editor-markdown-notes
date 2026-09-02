import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

import { imageMarkdownText } from '@/editor/extensions/image/image-markdown-text'
import type { ImageAttrs } from '@/editor/extensions/image/image-markdown-text'
import { ImageSourceField } from '@/editor/extensions/image/image-source-field'
import { useImageSelected } from '@/editor/extensions/image/use-image-selected'
import { resolveImageSrc } from '@/lib/host/resolve-image-src'

type ImageViewProps = Pick<
	NodeViewProps,
	'node' | 'editor' | 'getPos' | 'updateAttributes' | 'deleteNode'
>

/**
 * An image, always rendered - and, whenever the selection touches it, its own
 * `![alt](src "title")` revealed as real editable text underneath
 * (`ImageSourceField`), adapted for a node with no content of its own to hold
 * that text in (`useImageSelected` rather than `useCaretInside` - see its own
 * doc comment). `bubble-controls.tsx`'s "Edit source" button is the other way
 * in: it only has to move focus there, since selecting the image already
 * satisfies `useImageSelected`.
 *
 * Clearing that text deletes the image, the field being the only editable form
 * an image has.
 */
export function ImageView({
	node,
	editor,
	getPos,
	updateAttributes,
	deleteNode,
}: ImageViewProps) {
	const selected = useImageSelected({ editor, getPos })

	const handleCommit = (attrs: ImageAttrs | null) => {
		if (attrs) updateAttributes(attrs)
		else deleteNode()
	}
	const attrs = {
		src: String(node.attrs.src ?? ''),
		alt: String(node.attrs.alt ?? ''),
		title: node.attrs.title ? String(node.attrs.title) : null,
	}

	return (
		<NodeViewWrapper as="span" className="relative inline-block align-bottom">
			{selected ? (
				<ImageSourceField
					sourceText={imageMarkdownText(attrs)}
					onCommit={handleCommit}
				/>
			) : null}
			<img
				src={resolveImageSrc(attrs.src, window.imageBaseUris)}
				alt={attrs.alt}
				title={attrs.title ?? undefined}
				contentEditable={false}
			/>
		</NodeViewWrapper>
	)
}
