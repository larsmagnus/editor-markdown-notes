import { ErrorFallback } from '@/components/error-fallback'

interface AskInlineErrorWidgetProps {
	error: string
	onRetry: () => void
	onDismiss: () => void
}

/**
 * What `/ask` shows in place of the loading spinner once the request fails -
 * the same `ErrorFallback` every thrown-error boundary in the app renders,
 * so a failed request looks identical to a crashed subtree even though
 * nothing actually threw here (`ask-command.ts` catches a result, not an
 * exception). "Try again" re-runs the same prompt from the same position;
 * the X dismisses without retrying, leaving nothing behind.
 */
export function AskInlineErrorWidget({
	error,
	onRetry,
	onDismiss,
}: AskInlineErrorWidgetProps) {
	return (
		<ErrorFallback
			title="Ask Claude"
			error={new Error(error)}
			resetErrorBoundary={onRetry}
			onRemove={onDismiss}
		/>
	)
}
