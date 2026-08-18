import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import type { FiredEvent } from '../extension/probe-all-events'
import { subscribeToEveryEvent } from '../extension/probe-all-events'
import { readSearchMatches } from '../extension/read-search-match'

import {
	NOTE,
	pause,
	runSearch,
	setEditorAssociations,
	VIEW_TYPE,
} from './probe-support'

/**
 * What actually fires when a search result reveals a note that is already open.
 *
 * The earlier reading - "nothing fires" - came from a test where the panel was
 * already active, so it could not have fired a view-state change either way.
 * This subscribes to every runtime event before activating a second match, so
 * the answer covers events nobody thought to listen for.
 */
suite('Search reveal events', function () {
	this.timeout(90000)

	const workspace = vscode.workspace.workspaceFolders?.[0]
	const file = vscode.Uri.file(
		path.join(workspace?.uri.fsPath ?? process.cwd(), 'probe-fixture.md')
	)

	suiteSetup(async () => {
		await fs.writeFile(file.fsPath, NOTE)
		await setEditorAssociations({ '*.md': VIEW_TYPE })
	})

	suiteTeardown(async () => {
		await setEditorAssociations(undefined)
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		await fs.rm(file.fsPath, { force: true })
	})

	test('reports every event raised by revealing an already-open note', async () => {
		await runSearch('<input')

		// Open the note once, so the second activation reveals an existing tab.
		await vscode.commands.executeCommand('search.action.focusNextSearchResult')
		await pause(400)
		await vscode.commands.executeCommand('search.action.openResult')
		await pause(2000)

		const fired: FiredEvent[] = []
		const subscription = subscribeToEveryEvent(fired)
		console.log(`\n  hooked ${subscription.hooked.length} events`)

		try {
			// Back to the list, onto the next match, activate it. The note is open,
			// so this is the reveal case the design hinges on.
			await vscode.commands.executeCommand('search.action.focusSearchList')
			await pause(400)
			await vscode.commands.executeCommand(
				'search.action.focusNextSearchResult'
			)
			await pause(400)
			await vscode.commands.executeCommand('search.action.openResult')
			await pause(2000)
		} finally {
			subscription.dispose()
		}

		console.log('\n===== events raised by revealing an open note =====')
		for (const event of fired) {
			console.log(`  +${event.at}ms ${event.source} ${event.detail}`)
		}
		console.log(`===== ${fired.length} events =====\n`)

		// Whatever the design uses as its trigger has to appear in this list.
		assert.ok(
			(await readSearchMatches(file)).length > 0,
			'the fixture should still have matches'
		)
	})
})
