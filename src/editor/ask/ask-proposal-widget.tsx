import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { AskProposalActions } from '@/editor/ask/ask-proposal-actions'
import type { AskProposalState } from '@/editor/ask/ask-suggestion-extension'
import { cn } from '@/lib/utils'

interface AskProposalWidgetProps {
	proposal: AskProposalState
	onAccept: () => void
	onDecline: () => void
	onRetry: () => void
	onClose: () => void
	onEditText: (text: string) => void
}

/**
 * The proposed rewrite shown under a selection. The original text is left
 * untouched in the document above this card - only Accept ever touches it -
 * so this only ever shows the new text, not a repeat of the original. Once
 * the reply has fully arrived it's an editable text area, not static text -
 * the reply is a starting point the user can adjust before picking an
 * action, not a fait accompli. Decline discards the new text and keeps just
 * the original; Retry re-runs the same prompt for a fresh attempt; the X in
 * the corner keeps both versions in the document (for the user to reconcile
 * by hand) and dismisses the card without picking either.
 *
 * Mounted into a ProseMirror widget decoration by
 * `ask-proposal-widget-mount.ts`, kept standalone here so it is unit-testable
 * on its own, the same split the bubble menu's own controls use.
 */
export function AskProposalWidget({
	proposal,
	onAccept,
	onDecline,
	onRetry,
	onClose,
	onEditText,
}: AskProposalWidgetProps) {
	return (
		<div className="relative mt-2 block w-[400px] rounded-lg border border-border bg-popover text-sm text-popover-foreground shadow-xs">
			<Button
				type="button"
				variant="ghost"
				size="icon-xs"
				title="Keep both"
				aria-label="Keep both"
				disabled={proposal.status !== 'done'}
				onClick={onClose}
				className="absolute top-1 right-1"
			>
				<X className="size-3.5" />
			</Button>
			<div className={cn(proposal.status === 'done' ? 'p-0' : 'p-2')}>
				{proposal.status === 'error' ? (
					<p className="text-destructive">⚠️ {proposal.error}</p>
				) : proposal.status === 'done' ? (
					<Textarea
						value={proposal.text}
						onChange={(event) => onEditText(event.target.value)}
						rows={3}
						className="resize-none border-none bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
					/>
				) : proposal.text ? (
					<p className="whitespace-pre-wrap">{proposal.text}</p>
				) : (
					<p className="flex items-center gap-2 text-muted-foreground">
						<Spinner className="size-3.5" />
						Thinking…
					</p>
				)}
			</div>
			<AskProposalActions
				className="p-2"
				status={proposal.status}
				onAccept={onAccept}
				onDecline={onDecline}
				onRetry={onRetry}
			/>
		</div>
	)
}
