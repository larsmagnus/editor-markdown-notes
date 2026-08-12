import { CircleCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

type CopiedBadgeProps = { show: boolean }

/**
 * Transient "Copied" badge for a copy-to-clipboard action. Anchored off its
 * relatively-positioned parent's left edge (`right-full`) rather than given
 * its own width, so it grows further left as it needs to instead of getting
 * clipped against a narrow window's right edge - overlapping whatever
 * controls sit further left is the tradeoff, acceptable since it's transient.
 */
export function CopiedBadge({ show }: CopiedBadgeProps) {
	if (!show) return null

	return (
		<Badge
			role="status"
			className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
		>
			<CircleCheck /> Copied
		</Badge>
	)
}
