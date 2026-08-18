import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as path from 'path'

import * as vscode from 'vscode'

import { clearProbeEvents } from '../extension/reveal-probe'

import {
	dumpProbe,
	MATCH_LINE,
	NOTE,
	setEditorAssociations,
	VIEW_TYPE,
	waitForCustomEditorTab,
} from './probe-support'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/**
 * What, if anything, reaches the extension when a resource is opened at a
 * selection and that resource resolves to our custom editor.
 *
 * An investigation rather than a regression guard: it reproduces the search
 * view's own open call (`vscode.open` with an `ITextEditorOptions` selection)
 * and prints the full probe transcript, so the answer comes from this VSCode
 * build rather than from `vscode.d.ts`.
 */
suite('Search reveal probe', () => {
	const workspace = vscode.workspace.workspaceFolders?.[0]
	const file = vscode.Uri.file(
		path.join(workspace?.uri.fsPath ?? process.cwd(), 'probe-fixture.md')
	)

	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()

		await fs.writeFile(file.fsPath, NOTE)

		// The reported scenario: the custom editor *is* the default for markdown,
		// so a search result resolves straight to it.
		await setEditorAssociations({ '*.md': VIEW_TYPE })
	})

	suiteTeardown(async () => {
		await setEditorAssociations(undefined)
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		await fs.rm(file.fsPath, { force: true })
	})

	teardown(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	})

	test('records what `vscode.open` with a selection delivers', async () => {
		clearProbeEvents()

		// Exactly how the search view opens a result.
		await vscode.commands.executeCommand('vscode.open', file, {
			selection: new vscode.Range(MATCH_LINE, 1, MATCH_LINE, 7),
			preview: true,
		})

		const tab = await waitForCustomEditorTab()
		dumpProbe('vscode.open with selection')

		assert.ok(tab, 'the custom editor should have opened')
	})

	test('records what `vscode.openWith` with a selection delivers', async () => {
		clearProbeEvents()

		await vscode.commands.executeCommand('vscode.openWith', file, VIEW_TYPE, {
			selection: new vscode.Range(MATCH_LINE, 1, MATCH_LINE, 7),
		})

		const tab = await waitForCustomEditorTab()
		dumpProbe('vscode.openWith with selection')

		assert.ok(tab, 'the custom editor should have opened')
	})

	test('records a reveal into an already-open custom editor tab', async () => {
		await vscode.commands.executeCommand('vscode.open', file)
		await waitForCustomEditorTab()

		// Clicking a second match in a file that is already open is the case where
		// `resolveCustomTextEditor` is never called again at all.
		clearProbeEvents()
		await vscode.commands.executeCommand('vscode.open', file, {
			selection: new vscode.Range(MATCH_LINE, 55, MATCH_LINE, 61),
		})
		await new Promise((resolve) => setTimeout(resolve, 500))

		dumpProbe('reveal into an already-open tab')

		assert.ok(await waitForCustomEditorTab(), 'the tab should still be open')
	})
})
