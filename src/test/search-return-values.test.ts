import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import { NOTE, pause, runSearch } from './probe-support'

/**
 * Hunting a clipboard-free route to the focused search match.
 *
 * `search.action.copyMatch` answers only through the clipboard, which is a
 * visible side effect on the user's machine for what should be a read. Two
 * hypotheses worth killing cheaply: that a search command returns its result
 * directly through `executeCommand`, and that `getSearchResults` marks which
 * result the view has focused.
 *
 * Temporary, alongside `reveal-probe.ts`.
 */
suite('Search command return values', function () {
	this.timeout(60000)

	const workspace = vscode.workspace.workspaceFolders?.[0]
	const file = vscode.Uri.file(
		path.join(workspace?.uri.fsPath ?? process.cwd(), 'probe-fixture.md')
	)

	suiteSetup(async () => {
		await fs.writeFile(file.fsPath, NOTE)
	})

	suiteTeardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		await fs.rm(file.fsPath, { force: true })
	})

	test('reports whether any search command returns a value directly', async () => {
		await runSearch('<input id="second"')
		await vscode.commands.executeCommand('search.action.focusNextSearchResult')
		await pause(500)

		// Read-only or focus-only commands: none of these mutate the document.
		const candidates = [
			'search.action.getSearchResults',
			'search.action.focusNextSearchResult',
			'search.action.focusPreviousSearchResult',
			'search.action.focusSearchList',
			'search.action.openResult',
		]

		console.log('\n===== executeCommand return values =====')
		for (const command of candidates) {
			try {
				const returned: unknown = await vscode.commands.executeCommand(command)
				const shown =
					typeof returned === 'string'
						? `string(${returned.length} chars)`
						: JSON.stringify(returned)
				console.log(`  ${command} -> ${typeof returned} ${shown}`)
			} catch (error) {
				console.log(`  ${command} threw ${String(error)}`)
			}
			await pause(300)
		}
		console.log('===== end return values =====\n')

		assert.ok(true, 'diagnostic only')
	})

	test('reports whether getSearchResults marks the focused result', async () => {
		await runSearch('<input')

		const snapshots: string[] = []
		for (let step = 0; step < 4; step++) {
			await vscode.commands.executeCommand(
				'search.action.focusNextSearchResult'
			)
			await pause(400)
			snapshots.push(
				await vscode.commands.executeCommand<string>(
					'search.action.getSearchResults'
				)
			)
		}

		const distinct = new Set(snapshots)
		console.log('\n===== getSearchResults across four focus positions =====')
		console.log(`  distinct outputs: ${distinct.size} of ${snapshots.length}`)
		console.log('===== end focus marker =====\n')

		assert.strictEqual(
			distinct.size,
			1,
			'output identical regardless of focus means it carries no focus marker'
		)
	})
})
