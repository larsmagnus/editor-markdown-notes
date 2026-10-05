import * as assert from 'assert'

import * as vscode from 'vscode'

import { buildNoteIndex } from '#src/host/note-index'
import type { NoteIndexFilters } from '#src/lib/host/note-index-filter'
import type { NoteIndexEntry } from '#src/shared/messages'

export const DEFAULT_NOTE_INDEX_FILTERS: NoteIndexFilters = {
	respectGitignore: true,
	showAiToolFolders: true,
	hiddenDirectories: [],
}

/** A file in the repo, which is the workspace the extension suites run in. */
export function workspaceUri(...segments: string[]): vscode.Uri {
	const workspace = vscode.workspace.workspaceFolders?.[0]
	assert.ok(workspace, 'expected a workspace folder')
	return vscode.Uri.joinPath(workspace.uri, ...segments)
}

/** The index entry for a workspace file, if the index listed it. */
export function findEntry(
	entries: NoteIndexEntry[],
	...segments: string[]
): NoteIndexEntry | undefined {
	const uri = workspaceUri(...segments).toString()
	return entries.find((entry) => entry.uri === uri)
}

/** The index as the panel first asks for it, opened from `current`. */
export function buildDefaultNoteIndex(current = workspaceUri('README.md')) {
	return buildNoteIndex(current, DEFAULT_NOTE_INDEX_FILTERS)
}
