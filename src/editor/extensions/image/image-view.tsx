import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

import { imageMarkdownText } from '@/editor/extensions/image/image-markdown-text'
import { ImageSourceField } from '@/editor/extensions/image/image-source-field'
import { useImageSelected } from '@/editor/extensions/image/use-image-selected'
import { resolveImageSrc } from '@/lib/host/resolve-image-src'

type ImageViewProps = Pick<
	NodeViewProps,
	'node' | 'editor' | 'getPos' | 'updateAttributes'
>

/**
 * An image, always rendered - and, whenever the selection touches it, its own
 * `![alt](src "title")` revealed as real editable text underneath
 * (`ImageSourceField`), adapted for a node with no content of its own to hold
 * that text in (`useImageSelected` rather than `useCaretInside` - see its own
 * doc comment). `bubble-controls.tsx`'s "Edit source" button is the other way
 * in: it only has to move focus there, since selecting the image already
 * satisfies `useImageSelected`.
 */
export function ImageView({
	node,
	editor,
	getPos,
	updateAttributes,
}: ImageViewProps) {
	const isEditing = useImageSelected({ editor, getPos })
	const attrs = {
		src: String(node.attrs.src ?? ''),
		alt: String(node.attrs.alt ?? ''),
		title: node.attrs.title ? String(node.attrs.title) : null,
	}

	return (
		<NodeViewWrapper as="span" className="relative inline-block align-bottom">
			<img
				src={resolveImageSrc(attrs.src, window.imageBaseUris)}
				alt={attrs.alt}
				title={attrs.title ?? undefined}
				contentEditable={false}
			/>
			{isEditing ? (
				<ImageSourceField
					sourceText={imageMarkdownText(attrs)}
					onCommit={updateAttributes}
				/>
			) : null}
		</NodeViewWrapper>
	)
}
