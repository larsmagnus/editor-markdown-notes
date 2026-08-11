import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

import Header from '@/components/header'
import { PopoverArrow } from '@/components/popover-arrow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { useEditorImage } from '@/hooks/use-editor-image'

/** Edits the selected image's src and alt text, seeded from its current attributes. */
export function ImagePopover() {
	const { src, setSrc, alt, setAlt, selectedImage, updateImage } =
		useEditorImage()
	const [open, setOpen] = useState(false)

	const openWithCurrentImage = () => {
		const current = selectedImage()
		setSrc(current.src)
		setAlt(current.alt)
		setOpen(true)
	}

	const apply = () => updateImage(() => setOpen(false))

	return (
		<Popover open={open} onOpenChange={setOpen}>
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
			<PopoverContent side="top" sideOffset={12} className="w-80">
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault()
						event.stopPropagation()
						apply()
					}}
				>
					<div className="space-y-2">
						<Header level={4} className="leading-none">
							Image
						</Header>
					</div>
					<div className="grid gap-2">
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
						<Button type="submit" variant="default" size="sm">
							Apply
						</Button>
					</div>
				</form>
				<PopoverArrow />
			</PopoverContent>
		</Popover>
	)
}
