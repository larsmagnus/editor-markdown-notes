import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { cn } from 'cn'

import { PanZoom } from '#src/components/pan-zoom'
import { ImageToolbar } from '#src/editor/extensions/image/toolbar'
import { useImageCaretAdjacent } from '#src/hooks/use-image-caret-adjacent'
import { useImageCopy } from '#src/hooks/use-image-copy'
import { useImageEditSource } from '#src/hooks/use-image-edit-source'
import { useImageLink } from '#src/hooks/use-image-link'
import { resolveImageSrc } from '#src/lib/host/resolve-image-src'

type ImageViewProps = Pick<
	NodeViewProps,
	'node' | 'editor' | 'getPos' | 'deleteNode'
>

/**
 * An image, always rendered as a plain `<img>` - its `![alt](src "title")`
 * only exists as real document text while being edited (`edit-source.ts`'s
 * `ImageSource`, inserted immediately before this one). `PanZoom` gives it the
 * same pan/zoom overlay as `mermaid/diagram.tsx`; see `extensions.ts` for why
 * that's safe to nest inside an inline image.
 */
export function ImageView({
	node,
	editor,
	getPos,
	deleteNode,
}: ImageViewProps) {
	const attrs = {
		src: String(node.attrs.src ?? ''),
		alt: String(node.attrs.alt ?? ''),
		title: node.attrs.title ? String(node.attrs.title) : null,
	}

	const softFocused = useImageCaretAdjacent({ editor, getPos })
	const link = useImageLink({ node, editor, getPos })
	const [copied, onCopy] = useImageCopy(attrs)
	const handleEditSource = useImageEditSource({ editor, getPos })

	return (
		// `not-typeset` and the img's own `m-0`: typeset gives `img` a leading
		// vertical margin, invisible on the image's own rect but
		// real in its container's layout - `PanZoom`'s wrapper sizes itself to
		// that margined height, then clips the excess against its own
		// `max-h-[32rem]`, cutting the image's actual bottom edge off.
		<NodeViewWrapper
			as="span"
			className="group relative not-typeset inline-block align-bottom"
		>
			<PanZoom
				className={cn(
					// `min-w`/`min-h`: floors the frame to the toolbar's own size, so a
					// small image doesn't spill it off the page edge.
					'max-h-[32rem] min-w-40 min-h-14 rounded-md border border-border/50 p-2 hover:border-border',
					softFocused && 'border-ring ring-3 ring-ring/50'
				)}
				controls={
					<ImageToolbar
						onEditSource={handleEditSource}
						onDelete={deleteNode}
						copy={{ copied, onCopy }}
						link={link}
						visible={softFocused}
					/>
				}
			>
				<img
					src={resolveImageSrc(attrs.src, window.imageBaseUris)}
					alt={attrs.alt}
					title={attrs.title ?? undefined}
					contentEditable={false}
					// `react-zoom-pan-pinch`'s own CSS sets `pointer-events: none` on any
					// `img` inside its content div, so dragging always pans rather than
					// triggering the browser's native image drag - it also silently
					// blocks the click this needs for a `NodeSelection`.
					className="max-w-full h-auto m-0 pointer-events-auto!"
				/>
			</PanZoom>
		</NodeViewWrapper>
	)
}
