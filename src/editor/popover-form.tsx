import type { ReactNode } from 'react'

import Header from '@/components/header'
import { PopoverArrow } from '@/components/popover-arrow'
import { Button } from '@/components/ui/button'
import { PopoverContent } from '@/components/ui/popover'

interface PopoverFormProps {
	heading: string
	onApply: () => void
	children: ReactNode
}

/** The form scaffold shared by every editor popover: heading, fields, submit, arrow. */
export function PopoverForm({ heading, onApply, children }: PopoverFormProps) {
	return (
		<PopoverContent side="top" sideOffset={12} className="w-80">
			<form
				className="grid gap-4"
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					onApply()
				}}
			>
				<div className="space-y-2">
					<Header level={4} className="leading-none">
						{heading}
					</Header>
				</div>
				<div className="grid gap-2">
					{children}
					<Button type="submit" variant="default" size="sm">
						Apply
					</Button>
				</div>
			</form>
			<PopoverArrow />
		</PopoverContent>
	)
}
