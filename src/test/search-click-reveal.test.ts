import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import { readFocusedSearchMatch } from '../extension/read-search-match'

import {
	activateMatchesIn,
	NOTE,
	pause,
	runSearch,
	setEditorAssociations,
	VIEW_TYPE,
} from './search-test-support'

/**
 * The end-to-end answer: does activating a search result tell the custom editor
 * which match was activated?
 *
 * `search.action.openResult` opens the result the search view has focused,
 * which is what a mouse click does. Reading the focused match at that moment is
 * the mechanism the reveal feature would be built on, so this test is the one
 * that decides whether the feature is possible at all.
 */
suite('Search click reveal', function () {
	this.timeout(60000)

	const workspace = vscode.workspace.workspaceFolders?.[0]
	const file = vscode.Uri.file(
		path.join(workspace?.uri.fsPath ?? process.cwd(), 'probe-fixture.md')
	)
	const log = { info: () => {}, warn: () => {}, error: () => {} }

	suiteSetup(async () => {
		await fs.writeFile(file.fsPath, NOTE)
		await setEditorAssociations({ '*.md': VIEW_TYPE })
	})

	suiteTeardown(async () => {
		await setEditorAssociations(undefined)
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		await fs.rm(file.fsPath, { force: true })
	})

	test('identifies which match was activated, by line and column', async () => {
		await runSearch('<input id="second"')

		// Step onto the match itself: focus lands on the file node first.
		await vscode.commands.executeCommand('search.action.focusNextSearchResult')
		await pause(500)

		await vscode.commands.executeCommand('search.action.openResult')
		await pause(1500)

		const afterOpen = await readFocusedSearchMatch(file, log)
		console.log(`  focused after opening:  ${JSON.stringify(afterOpen)}\n`)

		assert.ok(
			afterOpen,
			'the activated match should still be readable once the editor has opened'
		)
		// `<input id="second"` sits at line 8, column 57 (1-based) in the fixture.
		assert.strictEqual(afterOpen.line, 7, 'line, 0-based')
		assert.strictEqual(afterOpen.column, 56, 'column, 0-based')
	})

	test('identifies a second match clicked while the note is already open', async () => {
		await runSearch('<input')

		const seen = await activateMatchesIn(file, log)

		console.log(`\n  columns activated in order: ${JSON.stringify(seen)}\n`)
		assert.ok(
			seen.includes(1) && seen.includes(56),
			`both matches on the line should be distinguishable, saw ${JSON.stringify(seen)}`
		)
	})
})
