import { isAiToolPath } from '#src/lib/host/ai-tool-paths'
import type { DirectoryCount } from '#src/shared/messages'

export type NoteIndexFilters = {
	respectGitignore: boolean
	showAiToolFolders: boolean
	hiddenDirectories: readonly string[]
}

type FilterableNote = { relativePath: string; gitIgnored: boolean }

/**
 * Whether a note belongs in the index. Git's verdict is overruled for AI-tool
 * paths while they are shown; a directory the author hid is final.
 */
export function isVisibleNote(
	relativePath: string,
	gitIgnored: boolean,
	filters: NoteIndexFilters
): boolean {
	return (
		!isHiddenDirectory(relativePath, filters) &&
		passesGitignore(relativePath, gitIgnored, filters)
	)
}

/**
 * The notes to list, plus the directories to offer for hiding. Counted before
 * the hidden ones are dropped, or a directory would vanish from the list the
 * moment it was hidden and could never be shown again.
 */
export function applyNoteIndexFilters<T extends FilterableNote>(
	notes: readonly T[],
	filters: NoteIndexFilters
): { visible: T[]; directories: DirectoryCount[] } {
	const unhidden = notes.filter(({ relativePath, gitIgnored }) =>
		passesGitignore(relativePath, gitIgnored, filters)
	)

	return {
		visible: unhidden.filter(
			({ relativePath }) => !isHiddenDirectory(relativePath, filters)
		),
		directories: countTopLevelDirectories(
			unhidden.map(({ relativePath }) => relativePath)
		),
	}
}

/** Whether the author hid the directory this note sits under. */
function isHiddenDirectory(
	relativePath: string,
	filters: NoteIndexFilters
): boolean {
	return filters.hiddenDirectories.includes(topLevelDirectory(relativePath))
}

/** Git's verdict, unless the note sits in an AI tool's shown territory. */
function passesGitignore(
	relativePath: string,
	gitIgnored: boolean,
	filters: NoteIndexFilters
): boolean {
	if (!gitIgnored || !filters.respectGitignore) return true

	return filters.showAiToolFolders && isAiToolPath(relativePath)
}

/** The first segment of a nested path; empty for a note at the workspace root. */
export function topLevelDirectory(relativePath: string): string {
	const separator = relativePath.indexOf('/')

	return separator === -1 ? '' : relativePath.slice(0, separator)
}

/** Notes per top-level directory, biggest first, the root's own notes left out. */
export function countTopLevelDirectories(
	relativePaths: readonly string[]
): DirectoryCount[] {
	const counts = new Map<string, number>()

	for (const relativePath of relativePaths) {
		const directory = topLevelDirectory(relativePath)
		if (directory === '') continue
		counts.set(directory, (counts.get(directory) ?? 0) + 1)
	}

	return [...counts]
		.map(([directory, count]) => ({ directory, count }))
		.sort((a, b) => b.count - a.count || a.directory.localeCompare(b.directory))
}
