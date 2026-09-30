import type { RefObject } from 'react'

import type { OpenNoteIndexEntry } from '#src/components/note-index-card'
import { NoteIndexCard } from '#src/components/note-index-card'
import { useGridArrowKeys } from '#src/hooks/use-grid-arrow-keys'
import type { NoteIndexEntry } from '#src/shared/messages'

type NoteIndexGridProps = {
	gridRef: RefObject<HTMLUListElement | null>
	entries: NoteIndexEntry[]
	onOpenEntry: OpenNoteIndexEntry
}

/** The index's cards, as many columns as fit, walkable with the arrow keys. */
export function NoteIndexGrid({
	gridRef,
	entries,
	onOpenEntry,
}: NoteIndexGridProps) {
	const handleKeyDown = useGridArrowKeys(gridRef)
	const now = Date.now()

	return (
		<ul
			ref={gridRef}
			aria-label="Notes"
			onKeyDown={handleKeyDown}
			className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3 overflow-y-auto px-1 pt-1 pb-6"
		>
			{entries.map((entry) => (
				<li key={entry.uri}>
					<NoteIndexCard entry={entry} now={now} onOpen={onOpenEntry} />
				</li>
			))}
		</ul>
	)
}
