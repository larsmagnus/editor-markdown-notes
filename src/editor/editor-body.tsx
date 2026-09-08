import { cn } from 'cn'
import type { ReactNode } from 'react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import EditorModeLive from '@/editor/editor-mode-live'
import { EditorModeRaw } from '@/editor/editor-mode-raw'

interface EditorBodyProps {
	content: string
	syncContent: (content: string) => void
	/** Show the markdown source rather than the rendered document. */
	raw: boolean
	className?: string
}

interface EditorModeSlotProps {
	active: boolean
	children: ReactNode
}

/**
 * A wrapper that either behaves as if it were not there, or hides its
 * subtree entirely.
 *
 * `EditorSurface`'s root div is `flex flex-1`, which only does anything as a
 * direct child of `main`'s own flex row - a plain wrapper div breaks that.
 * `display: contents` removes the wrapper from the box tree while active, so
 * the layout is exactly what it would be without this component; `hidden`
 * removes the inactive one from layout, the tab order and the accessibility
 * tree instead.
 */
function EditorModeSlot({ active, children }: EditorModeSlotProps) {
	return <div className={cn(active ? 'contents' : 'hidden')}>{children}</div>
}

/**
 * The editor body itself: both the rendered document and the markdown source,
 * kept mounted side by side so switching between them does not cost either
 * its undo history.
 *
 * A view kept in raw mode's shadow, or vice versa, still has to absorb
 * incoming content while hidden - closing the gap is what lets the visible
 * view stay current the moment it is revealed - so only `raw` decides which
 * one is on screen, not which one is mounted.
 */
export function EditorBody({
	content,
	syncContent,
	raw,
	className,
}: EditorBodyProps) {
	return (
		<>
			{/* Contained rather than fatal, so the toolbar survives and raw mode
			    stays reachable as the escape hatch for a note that will not parse. */}
			<EditorModeSlot active={!raw}>
				<AppErrorBoundary
					title="The editor stopped working"
					resetKeys={[content]}
				>
					<EditorModeLive
						content={content}
						syncContent={syncContent}
						active={!raw}
						includeProseBaseClassNames
						className={className}
					/>
				</AppErrorBoundary>
			</EditorModeSlot>
			<EditorModeSlot active={raw}>
				<EditorModeRaw
					content={content}
					syncContent={syncContent}
					active={raw}
					className={className}
				/>
			</EditorModeSlot>
		</>
	)
}
