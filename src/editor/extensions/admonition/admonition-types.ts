import {
	Info,
	Lightbulb,
	MessageSquareWarning,
	OctagonAlert,
	TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { AdmonitionType } from '#src/lib/admonition-tag'

type AdmonitionDefinition = {
	label: string
	icon: LucideIcon
}

/**
 * Every admonition's header, keyed by type so a sixth GFM kind fails to
 * compile until it has a label and an icon.
 */
export const ADMONITIONS: Record<AdmonitionType, AdmonitionDefinition> = {
	note: { label: 'Note', icon: Info },
	tip: { label: 'Tip', icon: Lightbulb },
	important: { label: 'Important', icon: MessageSquareWarning },
	warning: { label: 'Warning', icon: TriangleAlert },
	caution: { label: 'Caution', icon: OctagonAlert },
}
