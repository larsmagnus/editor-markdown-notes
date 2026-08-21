import {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { HeadingLevel } from '@/lib/heading-levels'

export const HEADING_LEVEL_ICONS: Record<HeadingLevel, LucideIcon> = {
	1: Heading1,
	2: Heading2,
	3: Heading3,
	4: Heading4,
	5: Heading5,
	6: Heading6,
}
