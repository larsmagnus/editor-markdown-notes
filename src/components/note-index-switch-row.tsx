import { useId } from 'react'

import { Switch } from '#src/components/ui/switch'

type NoteIndexSwitchRowProps = {
	label: string
	checked: boolean
	onCheckedChange: (checked: boolean) => void
}

/** One labelled on/off setting. */
export function NoteIndexSwitchRow({
	label,
	checked,
	onCheckedChange,
}: NoteIndexSwitchRowProps) {
	const labelId = useId()

	return (
		<div className="flex items-center justify-between gap-3">
			<span id={labelId}>{label}</span>
			<Switch
				aria-labelledby={labelId}
				checked={checked}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	)
}
