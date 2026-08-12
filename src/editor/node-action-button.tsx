import type { VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { buttonVariants } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

type NodeActionButtonProps = {
	icon: ReactNode
	/** The button's accessible name, and - unless `tooltip` overrides it - what
	 *  the tooltip shows. */
	label: string
	/** A shorter tooltip label, when `label` reads better in full elsewhere
	 *  (e.g. `aria-label="Copy code"`, tooltip `"Copy"`). */
	tooltip?: string
	size?: VariantProps<typeof buttonVariants>['size']
	className?: string
	onClick: () => void
}

/**
 * The icon-button-with-tooltip chrome every node view control (copy a block's
 * text, delete a block, ...) shares - one place to change how these look.
 *
 * Always `contentEditable={false}`: these render inside a ProseMirror node
 * view, and without it the cursor/selection would treat the button as
 * editable document content.
 */
export function NodeActionButton({
	icon,
	label,
	tooltip = label,
	size = 'icon-sm',
	className,
	onClick,
}: NodeActionButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size={size}
						contentEditable={false}
						aria-label={label}
						className={className}
						onClick={onClick}
					>
						{icon}
					</Button>
				}
			/>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	)
}
