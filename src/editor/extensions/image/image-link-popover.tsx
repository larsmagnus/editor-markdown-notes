import { cn } from 'cn'
import { Link } from 'lucide-react'
import { useId, useState } from 'react'

import { PopoverForm } from '@/components/popover-form'
import { PopoverIconTrigger } from '@/components/popover-icon-trigger'
import { PopoverTextField } from '@/components/popover-text-field'
import { Popover } from '@/components/ui/popover'

type ImageLinkPopoverProps = {
	linked: boolean
	href: string
	onSetLink: (href: string) => void
}

/**
 * Wraps this image in a link, or edits the one it already has - the image
 * toolbar's counterpart to `link-popover.tsx`, scoped to this image's own
 * position rather than the editor's current selection.
 */
export function ImageLinkPopover({
	linked,
	href,
	onSetLink,
}: ImageLinkPopoverProps) {
	const [open, setOpen] = useState(false)
	const [url, setUrl] = useState('')
	const urlFieldId = useId()

	const openWithCurrentLink = () => {
		setUrl(href)
		setOpen(true)
	}

	// Mirrors `use-editor-link.ts`'s `setLink`: a blank URL is a no-op, so the
	// popover stays open rather than closing as if it had applied one.
	const apply = () => {
		if (url.trim() === '') return
		onSetLink(url)
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverIconTrigger
				icon={Link}
				title="Link"
				onClick={openWithCurrentLink}
				className={cn('font-bold', linked && 'is-active')}
			/>
			<PopoverForm heading="Link" onApply={apply}>
				<PopoverTextField
					id={urlFieldId}
					label="URL"
					value={url}
					onChange={setUrl}
					placeholder="Enter URL"
				/>
			</PopoverForm>
		</Popover>
	)
}
