import { Check, RotateCcw, Trash2 } from 'lucide-react'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import { Button } from '@/components/ui/button'
import type { AskProposalState } from '@/editor/extensions/ask/ask-suggestion-extension'
import { cn } from '@/lib/utils'

interface AskProposalActionsProps extends DetailedHTMLProps<
	HTMLAttributes<HTMLDivElement>,
	HTMLDivElement
> {
	status: AskProposalState['status']
	onAccept: () => void
	onDecline: () => void
	onRetry: () => void
}

/** The proposal card's Accept/Decline/Retry row, split out of `AskProposalWidget` to keep its complexity under the repo's cap. */
export function AskProposalActions({
	className,
	status,
	onAccept,
	onDecline,
	onRetry,
	...rest
}: AskProposalActionsProps) {
	return (
		<div className={cn('mt-2 flex items-center gap-1', className)} {...rest}>
			<Button
				type="button"
				variant="default"
				size="sm"
				title="Accept"
				disabled={status !== 'done'}
				onClick={onAccept}
			>
				<Check className="size-4" />
			</Button>
			<Button
				type="button"
				variant="destructive"
				size="sm"
				title="Decline"
				onClick={onDecline}
			>
				<Trash2 className="size-4" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				title="Retry"
				disabled={status === 'streaming'}
				onClick={onRetry}
			>
				<RotateCcw className="size-4" />
			</Button>
		</div>
	)
}
