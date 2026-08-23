import type {
	AnchorHTMLAttributes,
	DetailedHTMLProps,
	PropsWithChildren,
} from 'react'

import { cn } from '@/lib/utils'

type LinkSkipProps = PropsWithChildren &
	DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>

/**
 * Skip link to jump past repetitive content.
 */
function LinkSkip({ children, className, ...rest }: LinkSkipProps) {
	return (
		<a
			className={cn(
				'sr-only focus:not-sr-only',
				'focus:fixed focus:top-3 focus:left-3 focus:z-50',
				'focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg',
				'focus:text-sm focus:font-medium focus:text-foreground',
				'focus:outline-none focus:ring-3 focus:ring-ring/50',
				className
			)}
			{...rest}
		>
			{children}
		</a>
	)
}

export default LinkSkip
