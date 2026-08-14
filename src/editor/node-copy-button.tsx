import { Check, Copy } from 'lucide-react'

import { NodeActionButton } from '@/editor/node-action-button'

type NodeCopyButtonProps = {
	/** Whether the copy just happened - see `useCopiedFeedback`. */
	copied: boolean
	/** The button's accessible name, e.g. `"Copy diagram code"`. */
	label: string
	onClick: () => void
}

/**
 * A node-view copy control that acknowledges the copy by swapping its own
 * icon, for overlays too small for `CopiedBadge` to sit beside.
 *
 * `copied` is a prop rather than internal state so one badge of feedback can
 * cover several ways to copy the same node (a button plus its menu items).
 */
export function NodeCopyButton({
	copied,
	label,
	onClick,
}: NodeCopyButtonProps) {
	return (
		<NodeActionButton
			icon={copied ? <Check /> : <Copy />}
			label={label}
			tooltip={copied ? 'Copied' : 'Copy'}
			onClick={onClick}
		/>
	)
}
