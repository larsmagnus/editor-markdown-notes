import * as assert from 'assert'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

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
			commands.includes('editor-markdown-notes.openFile'),
			'"Editor Markdown Notes: Open file" should be registered'
		)
		assert.ok(
			commands.includes('editor-markdown-notes.openMarkdownEditor'),
			'"Open with Editor Markdown Notes" should be registered'
		)
		assert.ok(
			commands.includes('editor-markdown-notes.showLogs'),
			'"Editor Markdown Notes: Show logs" should be registered'
		)
	})

	test('registers a command for each toolbar toggle', async () => {
		const commands = await vscode.commands.getCommands(true)

		for (const command of [
			'editor-markdown-notes.toggleRaw',
			'editor-markdown-notes.toggleFullWidth',
			'editor-markdown-notes.toggleTextTools',
			'editor-markdown-notes.selectTheme',
			'editor-markdown-notes.openInTextEditor',
		]) {
			assert.ok(commands.includes(command), `${command} should be registered`)
		}
	})

	test('contributes the settings that put a Settings entry on the extension page', () => {
		const config = vscode.workspace.getConfiguration('editorMarkdownNotes')

		assert.strictEqual(config.get('hideToolbar'), false)
		assert.strictEqual(config.get('centerContent'), false)
		assert.strictEqual(config.get('textToolsTargetAge'), 16)
	})
})
