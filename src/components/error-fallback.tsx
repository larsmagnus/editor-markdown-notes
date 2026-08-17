import { X } from 'lucide-react'
import type { FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/error-message'

interface ErrorFallbackProps extends FallbackProps {
	/** What broke, in the reader's terms - "The editor", "The writing tools". */
	title: string
	/**
	 * A second escape hatch beyond retry, for subtrees where a stuck state -
	 * an in-flight request, a proposal - can't be fixed by re-rendering and
	 * needs discarding instead. Omit for subtrees where retry alone is enough.
	 */
	onRemove?: () => void
	removeLabel?: string
}

/**
 * What a subtree renders instead of itself once it has thrown.
 *
 * Shows the message rather than a generic apology, because the two failures
 * this is most likely to catch - a note that will not parse and a diagram that
 * will not render - are both things the author can act on. The one non-thrown
 * exception is the `/ask` command's own result errors (`ask-command.ts`): a
 * failed request is a value, not a thrown error, but is routed through this
 * same component anyway so every failure in the app looks the same.
 */
export function ErrorFallback({
	title,
	error,
	resetErrorBoundary,
	onRemove,
	removeLabel = 'Dismiss',
}: ErrorFallbackProps) {
	return (
		<div
			role="alert"
			className="not-prose relative my-2 h-fit rounded-md border border-red-300 bg-red-50 p-3 pr-8 text-sm dark:border-red-900 dark:bg-red-950/40"
		>
			{onRemove && (
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					title={removeLabel}
					aria-label={removeLabel}
					onClick={onRemove}
					className="absolute top-1 right-1 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40"
				>
					<X className="size-3.5" />
				</Button>
			)}
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
