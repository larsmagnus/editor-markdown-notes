import type { ComponentProps, PropsWithChildren } from 'react'

import { Badge } from '@/components/ui/badge'
import { Marker } from '@/components/ui/marker'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

/**
 * Badge for inline loading or status badges
 */
export function BadgeLoading({
	children,
	className,
	...rest
}: PropsWithChildren & ComponentProps<typeof Badge>) {
	return (
		<Badge
			variant="outline"
			className={cn('text-muted-foreground', className)}
			{...rest}
		>
			<Spinner />
			<Marker className="shimmer text-xs">{children}</Marker>
		</Badge>
	)
}
