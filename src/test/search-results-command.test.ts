import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import { describe } from '../extension/reveal-probe-describe'

import { NOTE } from './probe-support'

/**
 * Whether the search view's own state is readable from an extension.
 *
 * `search.action.getSearchResults` and `search.action.copyMatch` are real
 * commands in this build. If either returns the current result set - with
 * ranges, and ideally the query - then a custom editor can correlate an open
 * against the match that caused it, which is the one thing
 * `resolveCustomTextEditor` cannot tell us.
 *
 * Temporary, alongside `reveal-probe.ts`.
 */
suite('Search results command', function () {
	// Both cases wait on ripgrep and on renderer-side focus moves, well past
	// mocha's 2s default.
	this.timeout(30000)

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

	test('reports what `search.action.getSearchResults` returns', async () => {
		await vscode.commands.executeCommand('workbench.action.findInFiles', {
			query: '<input',
			triggerSearch: true,
			isRegex: false,
		})

		// The search runs asynchronously in the renderer; give ripgrep a moment.
		await new Promise((resolve) => setTimeout(resolve, 3000))

		const results: unknown = await vscode.commands.executeCommand(
			'search.action.getSearchResults'
		)

		console.log('\n===== search.action.getSearchResults =====')
		console.log(`  typeof: ${typeof results}`)
		console.log(`  value: ${describe(results)}`)
		if (results && typeof results === 'object') {
			console.log(`  keys: ${Object.keys(results).join(', ')}`)
		}
		console.log('===== end getSearchResults =====\n')

		assert.ok(true, 'diagnostic only')
	})

	test('reports whether copyMatch tracks the focused result', async () => {
		const before = await vscode.env.clipboard.readText()
		await vscode.commands.executeCommand('search.action.focusSearchList')
		await new Promise((resolve) => setTimeout(resolve, 500))

		console.log('\n===== search.action.copyMatch per focused result =====')
		for (let step = 0; step < 5; step++) {
			await vscode.env.clipboard.writeText('')
			await vscode.commands.executeCommand('search.action.copyMatch')
			await new Promise((resolve) => setTimeout(resolve, 300))
			console.log(
				`  focus ${step}: ${JSON.stringify(await vscode.env.clipboard.readText())}`
			)
			await vscode.commands.executeCommand(
				'search.action.focusNextSearchResult'
			)
			await new Promise((resolve) => setTimeout(resolve, 300))
		}
		console.log('===== end copyMatch =====\n')

		await vscode.env.clipboard.writeText(before)
		assert.ok(true, 'diagnostic only')
	})

	test('reports whether findTextInFiles is callable at runtime', () => {
		const api = vscode.workspace as unknown as Record<string, unknown>

		// Present on the runtime object, but gated: calling it throws unless the
		// proposal is declared *and* VSCode runs with --enable-proposed-api, which
		// rules it out for a Marketplace build.
		console.log('\n===== findTextInFiles =====')
		for (const name of ['findTextInFiles', 'findTextInFiles2']) {
			console.log(`  ${name}: ${typeof api[name]}`)
		}
		console.log('===== end findTextInFiles =====\n')

		assert.ok(true, 'diagnostic only')
	})
})
