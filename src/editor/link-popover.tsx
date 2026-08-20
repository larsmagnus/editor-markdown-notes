import { Link } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { PopoverForm } from '@/editor/popover-form'
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
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="sm"
						title="Link"
						onClick={openWithCurrentLink}
						className={cn('font-bold', isLinkActive() ? 'is-active' : '')}
					>
						<Link className="size-4" />
					</Button>
				}
			/>
			<PopoverForm heading="Link" onApply={apply}>
				<div className="flex items-center gap-4">
					<Label htmlFor="url">URL</Label>
					<Input
						id="url"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						placeholder="Enter URL"
						type="text"
					/>
				</div>
			</PopoverForm>
		</Popover>
	)
}
