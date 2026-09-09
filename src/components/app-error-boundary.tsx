import { useCallback } from 'react'
import type { ComponentProps, PropsWithChildren } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { ErrorFallback } from '#src/components/error-fallback'
import { reportError } from '#src/lib/report-error'

type AppErrorBoundaryProps = PropsWithChildren<{
	/** What breaks if this subtree throws - "The editor", "The toolbar". */
	title: string
	/** Values whose change clears the fallback, typically the note on screen. */
	resetKeys?: unknown[]
	/** See `ErrorFallback`'s prop of the same name. */
	onRemove?: () => void
	removeLabel?: string
}> &
	ComponentProps<'div'>

/**
 * One failable subtree, contained and reported.
 *
 * Wraps `ErrorBoundary` so the fallback and the reporting are decided once
 * rather than at each of the seams, and so adding a seam is a single element.
 */
export function AppErrorBoundary({
	title,
	resetKeys,
	onRemove,
	removeLabel,
	children,
	className,
}: AppErrorBoundaryProps) {
	const renderFallback = useCallback(
		(props: FallbackProps) => (
			<ErrorFallback
				title={title}
				onRemove={onRemove}
				removeLabel={removeLabel}
				className={className}
				{...props}
			/>
		),
		[title, onRemove, removeLabel, className]
	)

	return (
		<ErrorBoundary
			fallbackRender={renderFallback}
			onError={reportError}
			resetKeys={resetKeys}
		>
			{children}
		</ErrorBoundary>
	)
}
