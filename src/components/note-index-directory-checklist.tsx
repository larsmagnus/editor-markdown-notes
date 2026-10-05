import { NoteIndexDirectoryRow } from '#src/components/note-index-directory-row'
import type { DirectoryCount } from '#src/shared/messages'

type NoteIndexDirectoryChecklistProps = {
	directories: DirectoryCount[]
	hiddenDirectories: string[]
	onToggleDirectoryHidden: (directory: string) => void
}

/**
 * Every folder on offer, ticked while its notes are listed. A hidden folder the
 * search no longer finds stays on the list, or it could never be shown again.
 */
export function NoteIndexDirectoryChecklist({
	directories,
	hiddenDirectories,
	onToggleDirectoryHidden,
}: NoteIndexDirectoryChecklistProps) {
	const rows = [
		...directories,
		...hiddenDirectories
			.filter(
				(hidden) => !directories.some(({ directory }) => directory === hidden)
			)
			.map((directory) => ({ directory, count: 0 })),
	]
	if (rows.length === 0) return null

	return (
		<div className="flex flex-col gap-1.5 border-t border-border pt-3">
			<p className="text-xs font-medium text-muted-foreground">Folders</p>
			<ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
				{rows.map(({ directory, count }) => (
					<li key={directory}>
						<NoteIndexDirectoryRow
							directory={directory}
							count={count}
							shown={!hiddenDirectories.includes(directory)}
							onToggle={onToggleDirectoryHidden}
						/>
					</li>
				))}
			</ul>
		</div>
	)
}
