import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'

import { NoteIndexSortToggle } from '#src/components/note-index-sort-toggle'
import { Input } from '#src/components/ui/input'
import type { NoteIndexSort } from '#src/lib/note-index/note-index-view'

type NoteIndexControlsProps = {
	filterRef: RefObject<HTMLInputElement | null>
	query: string
	onQueryChange: (query: string) => void
	sort: NoteIndexSort
	onSortChange: (sort: NoteIndexSort) => void
	/** ArrowDown in the filter, to hand focus on to the results. */
	onLeaveFilter: () => void
}

/** The index's filter field and sort order. */
export function NoteIndexControls({
	filterRef,
	query,
	onQueryChange,
	sort,
	onSortChange,
	onLeaveFilter,
}: NoteIndexControlsProps) {
	function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
		onQueryChange(event.target.value)
	}

	function handleFilterKeyDown(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown') return

		event.preventDefault()
		onLeaveFilter()
	}

	return (
		<div className="flex flex-wrap items-center gap-2 px-1 pr-9">
			<Input
				ref={filterRef}
				type="search"
				aria-label="Filter notes"
				placeholder="Filter by title, file, folder or tag"
				value={query}
				onChange={handleQueryChange}
				onKeyDown={handleFilterKeyDown}
				className="max-w-sm"
			/>
			<NoteIndexSortToggle sort={sort} onSortChange={onSortChange} />
		</div>
	)
}
