import { ImageIcon } from 'lucide-react'

import { Popover } from '@/components/ui/popover'
import { PopoverForm } from '@/editor/popover-form'
import { PopoverIconTrigger } from '@/editor/popover-icon-trigger'
import { PopoverTextField } from '@/editor/popover-text-field'
import { useImagePopover } from '@/hooks/use-image-popover'

/**
 * Edits the selected image's src and alt text, seeded from its current
 * attributes. See `useImagePopover` for the auto-open/auto-delete behavior
 * around an image with no src yet.
 */
export function ImagePopover() {
	const {
		src,
		setSrc,
		alt,
		setAlt,
		open,
		openWithCurrentImage,
		handleOpenChange,
		apply,
	} = useImagePopover()

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverIconTrigger
				icon={ImageIcon}
				title="Edit image"
				onClick={openWithCurrentImage}
			/>
			<PopoverForm heading="Image" onApply={apply}>
				<PopoverTextField
					id="image-src"
					label="Src"
					value={src}
					onChange={setSrc}
					placeholder="Enter URL or path"
				/>
				<PopoverTextField
					id="image-alt"
					label="Alt"
					value={alt}
					onChange={setAlt}
					placeholder="Describe the image"
				/>
			</PopoverForm>
		</Popover>
	)
}
