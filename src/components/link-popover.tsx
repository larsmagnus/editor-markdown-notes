import { Link } from 'lucide-react'
import { useState } from 'react'

import { PopoverForm } from '@/components/popover-form'
import { PopoverIconTrigger } from '@/components/popover-icon-trigger'
import { PopoverTextField } from '@/components/popover-text-field'
import { Popover } from '@/components/ui/popover'
import { useEditorLink } from '@/hooks/use-editor-link'
import { cn } from '@/lib/utils'

/** Sets the link on the selection, seeded with whatever link is already there. */
export function LinkPopover() {
	const { url, setUrl, selectedLink, isLinkActive, setLink } = useEditorLink()
	const [open, setOpen] = useState(false)

	const openWithCurrentLink = () => {
		setUrl(selectedLink())
		setOpen(true)
	}

	const apply = () => setLink(() => setOpen(false))

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverIconTrigger
				icon={Link}
				title="Link"
				onClick={openWithCurrentLink}
				className={cn('font-bold', isLinkActive() ? 'is-active' : '')}
			/>
			<PopoverForm heading="Link" onApply={apply}>
				<PopoverTextField
					id="url"
					label="URL"
					value={url}
					onChange={setUrl}
					placeholder="Enter URL"
				/>
			</PopoverForm>
		</Popover>
	)
}
