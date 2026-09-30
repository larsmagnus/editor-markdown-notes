import * as assert from 'assert'

import * as vscode from 'vscode'

import type { NoteIndexEntry } from '#src/shared/messages'

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
