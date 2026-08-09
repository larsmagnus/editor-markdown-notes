import { Code, FileType, PencilSparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ViewOptions } from '@/shared/messages'

export type EditMode = 'text' | 'raw' | 'live'

/**
 * The three edit-mode buttons, in display order. `'text'` leaves the webview
 * entirely (VSCode's built-in text editor), so it is never a persisted state -
 * only `'raw'`/`'live'` round-trip through `editModeFromViewOptions`.
 */
export const EDIT_MODE_OPTIONS: {
	value: EditMode
	label: string
	icon: LucideIcon
}[] = [
	{ value: 'text', label: 'Text editor', icon: FileType },
	{ value: 'raw', label: 'Raw editor', icon: Code },
	{ value: 'live', label: 'Live editor', icon: PencilSparkles },
]

export function editModeFromViewOptions(
	viewOptions: ViewOptions
): 'raw' | 'live' {
	return viewOptions.raw ? 'raw' : 'live'
}
