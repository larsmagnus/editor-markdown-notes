import { ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { PopoverForm } from '@/editor/popover-form'
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
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="sm"
						title="Edit image"
						onClick={openWithCurrentImage}
					>
						<ImageIcon className="size-4" />
					</Button>
				}
			/>
			<PopoverForm heading="Image" onApply={apply}>
				<div className="flex items-center gap-4">
					<Label htmlFor="image-src">Src</Label>
					<Input
						id="image-src"
						value={src}
						onChange={(event) => setSrc(event.target.value)}
						placeholder="Enter URL or path"
						type="text"
					/>
				</div>
				<div className="flex items-center gap-4">
					<Label htmlFor="image-alt">Alt</Label>
					<Input
						id="image-alt"
						value={alt}
						onChange={(event) => setAlt(event.target.value)}
						placeholder="Describe the image"
						type="text"
					/>
				</div>
			</PopoverForm>
		</Popover>
	)
}
