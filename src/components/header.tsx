import { createElement } from 'react'
import type {
	DetailedHTMLProps,
	HTMLAttributes,
	PropsWithChildren,
} from 'react'

import type { HeadingLevel } from '@/lib/heading-levels'
import { cn } from '@/lib/utils'

interface HeadingProps extends PropsWithChildren<
	DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
> {
	level: HeadingLevel
}

/**
 * Dynamic heading level component for `<h1>` to `<h6>` elements
 */
function Header({ level, className, children, ...props }: HeadingProps) {
	return createElement(
		`h${level}`,
		{ ...props, className: cn('font-bold', className) },
		children
	)
}

export default Header
