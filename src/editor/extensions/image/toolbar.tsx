import { Code, Trash2, Unlink, Workflow } from 'lucide-react'

import { BadgeCopied } from '#src/components/badge-copied'
import { ButtonAction } from '#src/components/button-action'
import { ButtonCopy } from '#src/components/button-copy'
import { OverlayToolbar } from '#src/components/overlay-toolbar'
import { ImageLinkPopover } from '#src/editor/extensions/image/image-link-popover'
import type { ImageLink } from '#src/hooks/use-image-link'

type ImageCopy = { copied: boolean; onCopy: () => void }

type ImageToolbarProps = {
	onEditSource: () => void
	onDelete: () => void
	copy: ImageCopy
	/** Only a draw.io image has a diagram to convert. */
	copyAsMermaid?: ImageCopy
	link: ImageLink
	/** Reveals the toolbar while the caret sits next to this image. */
	visible: boolean
}

/**
 * The controls that appear over a rendered image: edit its source, wrap/
 * unwrap it in a link, copy its markdown (or, for a draw.io diagram, its
 * mermaid), delete it. No dependency on
 * `NodeSelection` - every image's toolbar is mounted at once, not just
 * whichever one is selected - so every handler closes over this specific
 * image's own position rather than reading global editor selection.
 */
export function ImageToolbar({
	onEditSource,
	onDelete,
	copy,
	copyAsMermaid,
	link,
	visible,
}: ImageToolbarProps) {
	return (
		<OverlayToolbar visible={visible}>
			<ButtonAction
				icon={<Code />}
				label="Edit image source"
				tooltip="Edit source"
				onClick={onEditSource}
			/>
			<ImageLinkPopover
				linked={link.linked}
				href={link.href}
				onSetLink={link.setLink}
			/>
			{link.linked && (
				<ButtonAction
					icon={<Unlink />}
					label="Unlink image"
					onClick={link.unsetLink}
				/>
			)}
			<ButtonCopy
				copied={copy.copied}
				label="Copy image markdown"
				badgeSide="top"
				onClick={copy.onCopy}
			/>
			{copyAsMermaid && (
				<div className="relative inline-flex" contentEditable={false}>
					<ButtonAction
						icon={<Workflow />}
						label="Copy as Mermaid"
						onClick={copyAsMermaid.onCopy}
					/>
					<BadgeCopied show={copyAsMermaid.copied} side="top" />
				</div>
			)}
			<ButtonAction icon={<Trash2 />} label="Delete image" onClick={onDelete} />
		</OverlayToolbar>
	)
}
