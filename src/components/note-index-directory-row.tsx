import { useId } from 'react'

import { Checkbox } from '#src/components/ui/checkbox'

type NoteIndexDirectoryRowProps = {
	directory: string
	count: number
	shown: boolean
	onToggle: (directory: string) => void
}

/** One folder's checkbox, with how many notes it holds. */
export function NoteIndexDirectoryRow({
	directory,
	count,
	shown,
	onToggle,
}: NoteIndexDirectoryRowProps) {
	const labelId = useId()

	function handleCheckedChange() {
		onToggle(directory)
	}

	return (
		<div className="flex items-center gap-2">
			<Checkbox
				aria-labelledby={labelId}
				checked={shown}
				onCheckedChange={handleCheckedChange}
			/>
			<span id={labelId} className="min-w-0 flex-1 truncate font-mono text-xs">
				{directory}
			</span>
			<span className="text-xs text-muted-foreground tabular-nums">
				{count}
			</span>
		</div>
	)
}
