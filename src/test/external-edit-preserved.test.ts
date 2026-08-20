import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { pause, VIEW_TYPE } from './webview-panel-restore-support'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/** Past the editor's 1000ms auto-save debounce, with room for the write. */
const PAST_AUTOSAVE_MS = 4000

/**
 * A footnote definition, which the editor's schema has no node for.
 *
 * Round-tripping it through the editor escapes the marker to `\[^1]:`, turning
 * a working footnote into literal text - so if the note comes back byte-identical,
 * the editor did not write it, which is the whole point of the suite.
 */
const NOTE_WITH_A_FOOTNOTE = `# Release notes

Ships with tables[^1].

[^1]: Merged cells excepted.
`

const EDITED_EXTERNALLY = `# Release notes

Ships with tables and images[^1].

[^1]: Merged cells still excepted.
`

/**
 * An open panel must not rewrite a file that something else edited.
 *
 * The editor auto-saves whatever its document holds, and a host `update`
 * message replaces that document wholesale - so an external edit can come
 * back out of the editor as its own re-serialization and overwrite the real
 * file. Nothing the user did is involved: having the tab open is enough.
 */
suite('External edits', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('are left on disk exactly as written while a panel is open', async function () {
		this.timeout(30_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'release-notes.md'))
		await fs.writeFile(file.fsPath, NOTE_WITH_A_FOOTNOTE)

		try {
			await vscode.commands.executeCommand('vscode.openWith', file, VIEW_TYPE)
			await pause(3000)

			// The panel is visible, so this reaches the running page as an `update`.
			const document = await vscode.workspace.openTextDocument(file)
			const edit = new vscode.WorkspaceEdit()
			edit.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				EDITED_EXTERNALLY
			)
			await vscode.workspace.applyEdit(edit)
			await document.save()

			assert.strictEqual(
				await fs.readFile(file.fsPath, 'utf8'),
				EDITED_EXTERNALLY,
				'the external edit should have reached disk before the wait'
			)

			await pause(PAST_AUTOSAVE_MS)

			assert.strictEqual(
				await fs.readFile(file.fsPath, 'utf8'),
				EDITED_EXTERNALLY,
				'an open panel should leave someone else’s edit alone; re-serializing ' +
					'it escapes the footnote marker and the file stops working'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
