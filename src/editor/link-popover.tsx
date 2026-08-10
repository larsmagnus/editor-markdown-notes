import { Link } from 'lucide-react'
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
							Link
						</Header>
					</div>
					<div className="grid gap-2">
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
