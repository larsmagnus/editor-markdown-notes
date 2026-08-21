import { CircleCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Which edge of its anchor the badge floats off. */
export type BadgeCopiedSide = 'top' | 'right' | 'bottom' | 'left'

type BadgeCopiedProps = { show: boolean; side?: BadgeCopiedSide }

/**
 * Grows away from its anchor rather than given a fixed width, so it's never
 * clipped against a narrow window's edge - overlapping whatever sits on that
 * side is the tradeoff, acceptable since the badge is transient.
 */
const SIDE_CLASSES: Record<BadgeCopiedSide, string> = {
	top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
	right: 'top-1/2 left-full ml-2 -translate-y-1/2',
	bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
	left: 'top-1/2 right-full mr-2 -translate-y-1/2',
}

/**
 * Transient "Copied" badge for a copy-to-clipboard action, anchored off one
 * edge of its relatively-positioned parent - `left` (the default) unless
 * `side` says otherwise, e.g. because that edge would land on top of content
 * the copy button sits over.
 */
export function BadgeCopied({ show, side = 'left' }: BadgeCopiedProps) {
	if (!show) return null

	return (
		<Badge
			role="status"
			className={cn(
				'pointer-events-none absolute animate-in fade-in-0 zoom-in-95 duration-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
				SIDE_CLASSES[side]
			)}
		>
			<CircleCheck /> Copied
		</Badge>
	)
}
