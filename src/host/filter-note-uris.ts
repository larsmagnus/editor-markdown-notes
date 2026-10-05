import * as path from 'path'

import * as vscode from 'vscode'

import { listGitIgnored } from '#src/host/list-git-ignored'
import type { GitIgnoredPaths } from '#src/lib/host/git-ignored-paths'
import { isGitIgnored } from '#src/lib/host/git-ignored-paths'
import type { NoteIndexFilters } from '#src/lib/host/note-index-filter'
import { applyNoteIndexFilters } from '#src/lib/host/note-index-filter'
import type { DirectoryCount } from '#src/shared/messages'

type FilteredNoteUris = {
	uris: vscode.Uri[]
	directories: DirectoryCount[]
	gitUnavailable: boolean
}

/**
 * Applies git's ignore rules and the author's own choices to the found notes.
 *
 * Git is asked once per workspace folder, and only while `.gitignore` is
 * respected. A folder git cannot answer for keeps every note and is reported,
 * since the built-in exclusions already ran in the search itself.
 */
export async function filterNoteUris(
	uris: vscode.Uri[],
	filters: NoteIndexFilters
): Promise<FilteredNoteUris> {
	const ignoredByFolder = filters.respectGitignore
		? await listIgnoredByFolder(uris)
		: new Map<string, GitIgnoredPaths | null>()

	const notes = uris.map((uri) => {
		const folder = vscode.workspace.getWorkspaceFolder(uri)
		const ignored = folder && ignoredByFolder.get(folder.uri.fsPath)

		if (!folder) {
			return {
				uri,
				relativePath: path.posix.basename(uri.path),
				gitIgnored: false,
			}
		}
		const relativePath = path.posix.relative(folder.uri.path, uri.path)

		return {
			uri,
			relativePath,
			gitIgnored: ignored ? isGitIgnored(relativePath, ignored) : false,
		}
	})

	const { visible, directories } = applyNoteIndexFilters(notes, filters)

	return {
		uris: visible.map(({ uri }) => uri),
		directories,
		gitUnavailable: [...ignoredByFolder.values()].includes(null),
	}
}

/** One git run per workspace folder that holds a found note. */
async function listIgnoredByFolder(
	uris: vscode.Uri[]
): Promise<Map<string, GitIgnoredPaths | null>> {
	const folderPaths = new Set(
		uris.flatMap((uri) => {
			const folder = vscode.workspace.getWorkspaceFolder(uri)
			return folder ? [folder.uri.fsPath] : []
		})
	)
	const entries = await Promise.all(
		[...folderPaths].map(
			async (folderPath) =>
				[folderPath, await listGitIgnored(folderPath)] as const
		)
	)

	return new Map(entries)
}
