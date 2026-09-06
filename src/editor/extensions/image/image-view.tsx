import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

import { PanZoom } from '@/components/pan-zoom'
import { enterImageEditSource } from '@/editor/extensions/image/edit-source'
import { ImageToolbar } from '@/editor/extensions/image/toolbar'
import { useImageCaretAdjacent } from '@/hooks/use-image-caret-adjacent'
import { resolveImageSrc } from '@/lib/host/resolve-image-src'
import { cn } from '@/lib/utils'

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

	const handleEditSource = () => {
		const pos = getPos()
		if (pos === undefined) return
		editor
			.chain()
			.focus()
			.command(({ state, dispatch }) =>
				enterImageEditSource(pos)(state, dispatch)
			)
			.run()
	}

	return (
		// `not-prose` and the img's own `m-0`: Tailwind's typography plugin gives
		// `img` a default vertical margin, invisible on the image's own rect but
		// real in its container's layout - `PanZoom`'s wrapper sizes itself to
		// that margined height, then clips the excess against its own
		// `max-h-[32rem]`, cutting the image's actual bottom edge off.
		<NodeViewWrapper
			as="span"
			className="group relative not-prose inline-block align-bottom"
		>
			<PanZoom
				className={cn(
					// `min-w`/`min-h`: the toolbar overlay has its own minimum size
					// (two buttons plus padding) regardless of the image's - without
					// a floor here, an image smaller than that spills the toolbar out
					// past its own frame, and "Edit source" becomes unreachable.
					'max-h-[32rem] min-w-20 min-h-14 rounded-md border border-border/50 p-2 hover:border-border',
					softFocused && 'border-ring ring-3 ring-ring/50'
				)}
				controls={
					<ImageToolbar
						onEditSource={handleEditSource}
						onDelete={deleteNode}
						visible={softFocused}
					/>
				}
			>
				<img
					src={resolveImageSrc(attrs.src, window.imageBaseUris)}
					alt={attrs.alt}
					title={attrs.title ?? undefined}
					contentEditable={false}
					className="max-w-full h-auto m-0"
				/>
			</PanZoom>
		</NodeViewWrapper>
	)
}
