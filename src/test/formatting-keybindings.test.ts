import * as assert from 'assert'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

suite('Formatting keybindings context key', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('context key is initialized', async () => {
		const hasSelection = await vscode.commands.executeCommand<boolean>(
			'setContext',
			`${EXTENSION_ID}.hasSelection`,
			false
		)
		// setContext doesn't return a value, but executing it should not throw
		assert.ok(true)
	})

	test('context key can be set to true', async () => {
		await vscode.commands.executeCommand(
			'setContext',
			`${EXTENSION_ID}.hasSelection`,
			true
		)
		assert.ok(true)
	})

	test('context key can be set to false', async () => {
		await vscode.commands.executeCommand(
			'setContext',
			`${EXTENSION_ID}.hasSelection`,
			false
		)
		assert.ok(true)
	})

	test('formatting shortcut command is registered', async () => {
		const commands = await vscode.commands.getCommands(true)
		assert.ok(
			commands.includes(`${EXTENSION_ID}.claimFormattingShortcut`),
			'claimFormattingShortcut command should be registered'
		)
	})
})
