import { Badge } from '#src/components/ui/badge'
import { AGENTIC_TAG, isAgenticNote } from '#src/lib/note-index/agentic-note'
import type { NoteIndexEntry } from '#src/shared/messages'

type NoteIndexCardTagsProps = {
	entry: NoteIndexEntry
}

/**
 * A note's frontmatter tags, led by an amber agentic tag for a note written
 * for AI tools, so those stand apart from the notes people read.
 */
export function NoteIndexCardTags({ entry }: NoteIndexCardTagsProps) {
	const agentic = isAgenticNote(entry.directory, entry.fileName)
	if (!agentic && entry.tags.length === 0) return null

	return (
		<div className="flex flex-wrap gap-1 mb-2">
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
