import { useRef, useState } from 'react'

import type { OpenNoteIndexEntry } from '#src/components/note-index-card'
import { NoteIndexControls } from '#src/components/note-index-controls'
import { NoteIndexGrid } from '#src/components/note-index-grid'
import { NoteIndexStatus } from '#src/components/note-index-status'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '#src/components/ui/dialog'
import type { NoteIndexSort } from '#src/lib/note-index/note-index-view'
import { filterEntries, sortEntries } from '#src/lib/note-index/note-index-view'
import type { NoteIndex } from '#src/shared/messages'

type NoteIndexDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** `null` while the index is still being built. */
	index: NoteIndex | null
	/** The host could not search the workspace. */
	failed?: boolean
	onOpenEntry: OpenNoteIndexEntry
}

/**
 * Every note in the workspace as a full-screen grid of cards, filtered and
 * sorted in place. The filter takes focus on open, and ArrowDown hands it to
 * the grid, so a note can be found and opened without the mouse.
 */
export function NoteIndexDialog({
	open,
	onOpenChange,
	index,
	failed = false,
	onOpenEntry,
}: NoteIndexDialogProps) {
	const [query, setQuery] = useState('')
	const [sort, setSort] = useState<NoteIndexSort>('modified')
	const filterRef = useRef<HTMLInputElement>(null)
	const gridRef = useRef<HTMLUListElement>(null)

	const entries = sortEntries(filterEntries(index?.entries ?? [], query), sort)

	function focusFirstCard() {
		gridRef.current?.querySelector('button')?.focus()
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				initialFocus={filterRef}
				className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none bg-background/20 px-5 pt-6 pb-0 ring-0 backdrop-blur-md sm:max-w-none"
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Index</DialogTitle>
				</DialogHeader>

				<NoteIndexControls
					filterRef={filterRef}
					query={query}
					onQueryChange={setQuery}
					sort={sort}
					onSortChange={setSort}
					onLeaveFilter={focusFirstCard}
				/>

				<NoteIndexStatus
					index={index}
					failed={failed}
					query={query}
					matchCount={entries.length}
				/>

				<NoteIndexGrid
					gridRef={gridRef}
					entries={entries}
					onOpenEntry={onOpenEntry}
				/>
			</DialogContent>
		</Dialog>
	)
}
