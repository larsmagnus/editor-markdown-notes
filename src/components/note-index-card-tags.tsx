import { Badge } from '#src/components/ui/badge'
import { AGENTIC_TAG, isAgenticNote } from '#src/lib/note-index/agentic-note'
import type { NoteIndexEntry } from '#src/shared/messages'

type NoteIndexCardTagsProps = {
	entry: NoteIndexEntry
}

/**
 * A note's frontmatter tags, led by an amber agentic tag for a note written
 * for AI tools, so those stand apart from the notes people read. One clipped
 * row that is there even with nothing in it, so every card is the same height.
 */
export function NoteIndexCardTags({ entry }: NoteIndexCardTagsProps) {
	const agentic = isAgenticNote(entry.directory, entry.fileName)

	return (
		<div className="flex h-5 flex-nowrap gap-1 overflow-hidden">
			{agentic && (
				<Badge className="bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
					{AGENTIC_TAG}
				</Badge>
			)}
			{entry.tags.map((tag) => (
				<Badge key={tag} variant="secondary">
					{tag}
				</Badge>
			))}
		</div>
	)
}
