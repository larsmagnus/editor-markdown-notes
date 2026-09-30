import * as vscode from 'vscode'

import { CONFIG_SECTION } from '#src/host/constants'
import { isMarkdownFile } from '#src/lib/host/markdown-file-extensions'
import {
	buildNoteIndexExclude,
	NOTE_INDEX_INCLUDE,
} from '#src/lib/host/note-index-scope'

/**
 * With no folder open there is no workspace to search, so the note's own
 * folder stands in for one.
 */
export async function findNoteUris(current: vscode.Uri): Promise<vscode.Uri[]> {
	if (!vscode.workspace.workspaceFolders?.length) {
		return listSiblingNotes(current)
	}

	const exclude = buildNoteIndexExclude(
		vscode.workspace.getConfiguration('files').get('exclude'),
		vscode.workspace.getConfiguration(CONFIG_SECTION).get('index.exclude')
	)

	return vscode.workspace.findFiles(NOTE_INDEX_INCLUDE, exclude)
}

/** The notes beside `current`, not recursive; none for an unsaved note with no folder. */
async function listSiblingNotes(current: vscode.Uri): Promise<vscode.Uri[]> {
	const directory = vscode.Uri.joinPath(current, '..')

	try {
		const children = await vscode.workspace.fs.readDirectory(directory)
		return children
			.filter(
				([name, type]) => type === vscode.FileType.File && isMarkdownFile(name)
			)
			.map(([name]) => vscode.Uri.joinPath(directory, name))
	} catch {
		return []
	}
}
