import type {
	AnchorHTMLAttributes,
	DetailedHTMLProps,
	PropsWithChildren,
} from 'react'

import { cn } from '@/lib/utils'

type LinkSkipProps = PropsWithChildren &
	DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>

/**
 * Skip link to jump past repetetive content
 * Uses `<a>` as `Link` from 'next/link' doesn't handle focus correctly for internal/fragment links
 */
function LinkSkip({ children, className, ...rest }: LinkSkipProps) {
	return (
		<a className={cn('sr-only focus:not-sr-only', className)} {...rest}>
			{children}
		</a>
	)
}

export default LinkSkip
