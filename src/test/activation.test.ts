import * as assert from 'assert'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.punchdown'

suite('Activation and contributions', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})
	test('activates', () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)

		assert.strictEqual(extension?.isActive, true)
	})

	test('registers the command palette and context menu commands', async () => {
		const commands = await vscode.commands.getCommands(true)

		assert.ok(
			commands.includes('punchdown.openFile'),
			'"punchdown: Open file" should be registered'
		)
		assert.ok(
			commands.includes('punchdown.openMarkdownEditor'),
			'"Open with punchdown" should be registered'
		)
		assert.ok(
			commands.includes('punchdown.showLogs'),
			'"punchdown: Show logs" should be registered'
		)
	})

	test('registers a command for each toolbar toggle', async () => {
		const commands = await vscode.commands.getCommands(true)

		for (const command of [
			'punchdown.toggleRaw',
			'punchdown.toggleFullWidth',
			'punchdown.toggleTextTools',
			'punchdown.selectTheme',
			'punchdown.selectSpellingLanguage',
			'punchdown.openInTextEditor',
		]) {
			assert.ok(commands.includes(command), `${command} should be registered`)
		}
	})

	test('registers the formatting shortcut command', async () => {
		const commands = await vscode.commands.getCommands(true)

		assert.ok(
			commands.includes('punchdown.claimFormattingShortcut'),
			'claimFormattingShortcut command should be registered'
		)
	})

	test('contributes the settings that put a Settings entry on the extension page', () => {
		const config = vscode.workspace.getConfiguration('punchdown')

		assert.strictEqual(config.get('hideToolbar'), false)
		assert.strictEqual(config.get('centerContent'), false)
		assert.strictEqual(config.get('textToolsTargetAge'), 16)
	})
})
