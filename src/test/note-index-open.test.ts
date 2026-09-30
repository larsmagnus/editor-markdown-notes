import * as assert from 'assert'

import * as vscode from 'vscode'

import { openNoteIndexEntry } from '#src/host/open-note-index-entry'
import { workspaceUri } from '#src/test/note-index-test-support'
import {
	EXTENSION_ID,
	isCustomEditorTab,
	waitForActiveTab,
} from '#src/test/tab-test-support'

suite('Opening a note from the index', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('opens an entry in the custom editor', async () => {
		const note = workspaceUri('public', 'other-note.md')

		try {
			await openNoteIndexEntry(note.toString(), false)

			const tab = await waitForActiveTab(isCustomEditorTab)
			assert.ok(
				tab && isCustomEditorTab(tab),
				'the note should open in the custom editor'
			)
			assert.strictEqual(tab.input.uri.toString(), note.toString())
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		}
	})

	test('opens an entry beside the current editor', async () => {
		const first = workspaceUri('public', 'notes.md')
		const second = workspaceUri('public', 'other-note.md')

		try {
			await openNoteIndexEntry(first.toString(), false)
			await openNoteIndexEntry(second.toString(), true)

			const tab = await waitForActiveTab(
				(candidate) =>
					isCustomEditorTab(candidate) &&
					candidate.input.uri.toString() === second.toString()
			)
			assert.ok(tab, 'the second note should be active')
			assert.strictEqual(vscode.window.tabGroups.all.length, 2)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		}
	})

	test('refuses to open a file that is not markdown', async () => {
		const note = workspaceUri('public', 'notes.md')
		const file = workspaceUri('package.json')

		try {
			await openNoteIndexEntry(note.toString(), false)
			assert.ok(await waitForActiveTab(isCustomEditorTab), 'note should open')

			await openNoteIndexEntry(file.toString(), false)

			const tab = vscode.window.tabGroups.activeTabGroup.activeTab
			assert.ok(tab && isCustomEditorTab(tab), 'the note should stay active')
			assert.strictEqual(tab.input.uri.toString(), note.toString())
			assert.strictEqual(vscode.window.tabGroups.activeTabGroup.tabs.length, 1)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		}
	})
})
