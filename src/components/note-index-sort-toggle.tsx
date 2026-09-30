import { ToggleGroup, ToggleGroupItem } from '#src/components/ui/toggle-group'
import type { NoteIndexSort } from '#src/lib/note-index/note-index-view'

const SORT_OPTIONS: { value: NoteIndexSort; label: string; text: string }[] = [
	{ value: 'modified', label: 'Sort by last edited', text: 'Edited' },
	{ value: 'title', label: 'Sort by title', text: 'Title' },
	{ value: 'path', label: 'Sort by path', text: 'Path' },
]

type NoteIndexSortToggleProps = {
	sort: NoteIndexSort
	onSortChange: (sort: NoteIndexSort) => void
}

/** Picks the order of the index's cards; exactly one is always pressed. */
export function NoteIndexSortToggle({
	sort,
	onSortChange,
}: NoteIndexSortToggleProps) {
	function handleSortChange(values: string[]) {
		// A toggle group lets its only pressed item be unpressed; a sort cannot.
		const next = SORT_OPTIONS.find((option) => option.value === values[0])
		if (next) onSortChange(next.value)
	}

	return (
		<ToggleGroup value={[sort]} onValueChange={handleSortChange}>
			{SORT_OPTIONS.map(({ value, label, text }) => (
				<ToggleGroupItem key={value} value={value} aria-label={label}>
					{text}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	)
}
