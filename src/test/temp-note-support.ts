import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

/** A logger that drops everything, for a writer under test. */
export const log = { info: () => {}, warn: () => {}, error: () => {} }

/** A note on disk holding `contents`, opened as a `TextDocument`. */
export async function openTempNote(contents: string) {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
	const file = path.join(directory, 'notes.md')
	await fs.writeFile(file, contents)

	return vscode.workspace.openTextDocument(vscode.Uri.file(file))
}
