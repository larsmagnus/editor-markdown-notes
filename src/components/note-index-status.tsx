import { Spinner } from '#src/components/ui/spinner'
import type { NoteIndex } from '#src/shared/messages'

type NoteIndexStatusProps = {
	index: NoteIndex | null
	failed: boolean
	query: string
	matchCount: number
}

/**
 * Whatever the grid alone cannot say: that the index is still loading, that it
 * is empty or matches nothing, or that the cap left notes out.
 */
export function NoteIndexStatus({
	index,
	failed,
	query,
	matchCount,
}: NoteIndexStatusProps) {
	const message = failed
		? 'Could not list the notes. “punchdown: Show logs” has the details.'
		: statusMessage(index, query, matchCount)
	if (!message) return null

	return (
		<p
			role="status"
			className="flex items-center gap-2 px-1 text-muted-foreground"
		>
			{index === null && !failed && <Spinner />}
			{message}
		</p>
	)
}

/** The one status that applies, most fundamental first; `null` when the grid speaks for itself. */
function statusMessage(
	index: NoteIndex | null,
	query: string,
	matchCount: number
): string | null {
	if (index === null) return 'Finding notes…'
	if (index.total === 0) return 'No notes in this workspace'
	if (matchCount === 0) return `No notes match “${query.trim()}”`
	if (index.total > index.entries.length) {
		return `Showing the ${index.entries.length.toLocaleString()} most recently edited of ${index.total.toLocaleString()} notes`
	}

	return null
}
