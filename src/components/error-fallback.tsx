import type { FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/error-message'

interface ErrorFallbackProps extends FallbackProps {
	/** What broke, in the reader's terms - "The editor", "The writing tools". */
	title: string
}

/**
 * What a subtree renders instead of itself once it has thrown.
 *
 * Shows the message rather than a generic apology, because the two failures
 * this is most likely to catch - a note that will not parse and a diagram that
 * will not render - are both things the author can act on.
 */
export function ErrorFallback({
	title,
	error,
	resetErrorBoundary,
}: ErrorFallbackProps) {
	return (
		<div
			role="alert"
			className="not-prose my-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/40"
		>
			<p className="m-0 font-medium text-red-700 dark:text-red-300">
				{title} stopped working
			</p>
			<p className="mt-1 mb-0 font-mono text-xs break-words text-red-600 dark:text-red-400">
				{errorMessage(error)}
			</p>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="mt-3"
				onClick={resetErrorBoundary}
			>
				Try again
			</Button>
		</div>
	)
}
