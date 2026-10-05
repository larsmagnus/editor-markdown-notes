import { FolderIcon } from 'lucide-react'

const WORKSPACE_ROOT_LABEL = 'Workspace root'

type NoteIndexCardDirectoryProps = {
	directory: string
}

/**
 * Where the note lives, muted and set apart from the file name by a folder
 * icon. Cut at the start rather than the end, since the folder nearest the
 * note says the most; the full path is in the tooltip.
 */
export function NoteIndexCardDirectory({
	directory,
}: NoteIndexCardDirectoryProps) {
	return (
		<span className="flex min-w-0 items-center gap-1 text-muted-foreground">
			<FolderIcon aria-hidden className="size-3 shrink-0" />
			<span
				title={directory || WORKSPACE_ROOT_LABEL}
				className="min-w-0 flex-1 truncate text-left font-mono [direction:rtl]"
			>
				<bdi>{directory || '/'}</bdi>
			</span>
		</span>
	)
}
