import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { getWebviewProblems } from '../lib/webview-diagnostics'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

suite('Webview startup', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})
	test('opens a note without the editor reporting a problem', async function () {
		// Longer than Mocha's 2s default, because the check below outwaits the
		// webview's own watchdog.
		this.timeout(15_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(
			file.fsPath,
			'# Hello\n\nA note with a [link](/other).\n'
		)

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			// The webview's watchdog reports an empty #root two seconds in, so a
			// quiet channel past that point means the app really did render - not
			// just that the bundle loaded without throwing.
			await new Promise((resolve) => setTimeout(resolve, 3000))

			assert.deepStrictEqual(getWebviewProblems(), [])
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	/**
	 * Every panel is built with the scroll offset the host remembers for that
	 * document, injected into the page as a global. A second open is where a
	 * remembered offset first reaches the HTML, and a global that failed to
	 * serialise would take the whole inline script - and the app with it - down
	 * with it, so the reopen needs the same clean-startup check as the first.
	 */
	test('reopens a note it has already shown once', async function () {
		this.timeout(20_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Hello\n\nA note worth returning to.\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)
			await new Promise((resolve) => setTimeout(resolve, 3000))
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')

			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)
			await new Promise((resolve) => setTimeout(resolve, 3000))

			assert.deepStrictEqual(getWebviewProblems(), [])
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	// The analyser runs in a worker booted from a blob URL. If `worker-src` were
	// missing from the CSP the panel would still render and only the checks would
	// silently never appear - so the failure has to be caught here, where the log
	// bridge forwards the CSP violation.
	test('starts the text tools worker without a policy violation', async function () {
		this.timeout(15_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(
			file.fsPath,
			'# Hello\n\nThe report was written by the committee, which will utilize it.\n'
		)

		await vscode.commands.executeCommand(
			'editor-markdown-notes.toggleTextTools'
		)

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			// Past the watchdog, and well past the 500ms analysis debounce, so the
			// worker has had to start for real.
			await new Promise((resolve) => setTimeout(resolve, 4000))

			assert.deepStrictEqual(getWebviewProblems(), [])
		} finally {
			// Left on, the toggle would leak into every test that follows.
			await vscode.commands.executeCommand(
				'editor-markdown-notes.toggleTextTools'
			)
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
