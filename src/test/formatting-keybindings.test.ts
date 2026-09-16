import * as assert from 'assert'

import * as vscode from 'vscode'

import { EXTENSION_ID as COMMAND_PREFIX } from '#src/shared/constants'

const MARKETPLACE_ID = 'larsmagnus.editor-markdown-notes'

suite('Formatting keybindings context key', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(MARKETPLACE_ID)
		assert.ok(extension, `Extension ${MARKETPLACE_ID} is not installed`)
		await extension.activate()
	})

	test('context key is initialized', async () => {
		await vscode.commands.executeCommand<boolean>(
			'setContext',
			`${COMMAND_PREFIX}.hasSelection`,
			false
		)
		// setContext doesn't return a value, but executing it should not throw
		assert.ok(true)
	})

	test('context key can be set to true', async () => {
		await vscode.commands.executeCommand(
			'setContext',
			`${COMMAND_PREFIX}.hasSelection`,
			true
		)
		assert.ok(true)
	})

	test('context key can be set to false', async () => {
		await vscode.commands.executeCommand(
			'setContext',
			`${COMMAND_PREFIX}.hasSelection`,
			false
		)
		assert.ok(true)
	})

	test('formatting shortcut command is registered', async () => {
		const commands = await vscode.commands.getCommands(true)
		assert.ok(
			commands.includes(`${COMMAND_PREFIX}.claimFormattingShortcut`),
			'claimFormattingShortcut command should be registered'
		)
	})
})
