import { createElement } from 'react'
import type {
  DetailedHTMLProps,
  HTMLAttributes,
  PropsWithChildren,
} from 'react'

import { cn } from '@/lib/utils'

type HeadingLevels = 1 | 2 | 3 | 4 | 5 | 6

interface HeadingProps
  extends PropsWithChildren<
    DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
  > {
  level: HeadingLevels
}

/**
 * Dynamic heading level component for `<h1>` to `<h6>` elements
 */
function Header({ level, className, children, ...props }: HeadingProps) {
  return createElement(
    `h${level}`,
    { ...props, className: cn('font-serif', className) },
    children
  )
}

export default Header
