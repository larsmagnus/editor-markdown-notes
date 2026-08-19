import { Maximize2, Minimize2, PencilRuler } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ViewOptions } from '@/shared/messages'

type BooleanViewOption = 'fullWidth' | 'textTools'

/**
 * The toolbar's boolean toggles, in display order.
 *
 * One table drives both directions. The toggle group hands back the whole list
 * of pressed values, so the handler rebuilds every option from it - and a toggle
 * missing from either the forward or the inverse mapping used to be silently
 * reset the next time any other one was used.
 */
export const VIEW_TOGGLES: {
	/** The toggle group's own value. Historically a class name, hence `max-w-full`. */
	value: string
	key: BooleanViewOption
	label: string
	on: LucideIcon
	off: LucideIcon
}[] = [
	{
		value: 'max-w-full',
		key: 'fullWidth',
		label: 'Toggle full width',
		on: Maximize2,
		off: Minimize2,
	},
	{
		value: 'text-tools',
		key: 'textTools',
		// Not `SpellCheck`, which belongs to the one check inside the panel that
		// is actually about spelling - the panel itself is five writing checks.
		label: 'Toggle text tools',
		on: PencilRuler,
		off: PencilRuler,
	},
]

export function toToggleValues(viewOptions: ViewOptions): string[] {
	return VIEW_TOGGLES.filter(({ key }) => viewOptions[key]).map(
		({ value }) => value
	)
}

/**
 * The return type is what forces every option to be accounted for; the table is
 * what keeps the toggle strings from being written down twice.
 */
export function fromToggleValues(
	values: string[]
): Pick<ViewOptions, BooleanViewOption> {
	const isPressed = (key: BooleanViewOption) => {
		const toggle = VIEW_TOGGLES.find((candidate) => candidate.key === key)

		return toggle ? values.includes(toggle.value) : false
	}

	return {
		fullWidth: isPressed('fullWidth'),
		textTools: isPressed('textTools'),
	}
}
