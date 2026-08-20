import type { VariantProps } from 'class-variance-authority'
import { Copy } from 'lucide-react'

import { CopiedBadge } from '@/components/copied-badge'
import type { CopiedBadgeSide } from '@/components/copied-badge'
import type { buttonVariants } from '@/components/ui/button'
import { ButtonAction } from '@/editor/button-action'
import { cn } from '@/lib/utils'

type ButtonCopyProps = {
	/** Whether the copy just happened - see `useCopiedFeedback`. */
	copied: boolean
	/** The button's accessible name, e.g. `"Copy diagram code"`. */
	label: string
	/** Which side of the button the "Copied" badge appears on - see
	 *  `CopiedBadge`'s default when the button's surroundings don't matter. */
	badgeSide?: CopiedBadgeSide
	size?: VariantProps<typeof buttonVariants>['size']
	/** Applied to the relatively-positioned wrapper, e.g. to place the button
	 *  absolutely over the node it copies from. */
	className?: string
	onClick: () => void
}

/**
 * A node-view copy control that shows `CopiedBadge` beside itself.
 *
 * `copied` is a prop rather than internal state so one badge of feedback can
 * cover several ways to copy the same node (a button plus its menu items).
 */
export function ButtonCopy({
	copied,
	label,
	badgeSide,
	size,
	className,
	onClick,
}: ButtonCopyProps) {
	return (
		<div className={cn('relative inline-flex', className)}>
			<ButtonAction
				icon={<Copy />}
				label={label}
				tooltip="Copy"
				size={size}
				onClick={onClick}
			/>
			<CopiedBadge show={copied} side={badgeSide} />
		</div>
	)
}
