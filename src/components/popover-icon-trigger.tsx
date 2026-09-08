import { cn } from 'cn'
import type { LucideIcon } from 'lucide-react'

import { Button } from '#src/components/ui/button'
import { PopoverTrigger } from '#src/components/ui/popover'

interface PopoverIconTriggerProps {
	icon: LucideIcon
	title: string
	onClick?: () => void
	className?: string
}

/** The icon button that opens an editor popover, shared by every one of them. */
export function PopoverIconTrigger({
	icon: Icon,
	title,
	onClick,
	className,
}: PopoverIconTriggerProps) {
	return (
		<PopoverTrigger
			render={
				<Button
					type="button"
					variant="ghost"
					size="sm"
					title={title}
					onClick={onClick}
					className={cn(className)}
				>
					<Icon className="size-4" />
				</Button>
			}
		/>
	)
}
