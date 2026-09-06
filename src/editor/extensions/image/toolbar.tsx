import { Code, Trash2 } from 'lucide-react'

import { ButtonAction } from '@/components/button-action'
import { OverlayToolbar } from '@/components/overlay-toolbar'

type ImageToolbarProps = {
	onEditSource: () => void
	onDelete: () => void
	/** Reveals the toolbar while the caret sits next to this image. */
	visible: boolean
}

/**
 * The controls that appear over a rendered image: edit its source, delete it.
 * No dependency on `NodeSelection` - every image's toolbar is mounted at
 * once, not just whichever one is selected - so `onEditSource`/`onDelete`
 * close over this specific image's own position rather than reading global
 * editor selection.
 */
export function ImageToolbar({
	onEditSource,
	onDelete,
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
			<ButtonAction icon={<Trash2 />} label="Delete image" onClick={onDelete} />
		</OverlayToolbar>
	)
}
