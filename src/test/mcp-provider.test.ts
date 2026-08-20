import * as assert from 'assert'
import { existsSync } from 'node:fs'

import * as vscode from 'vscode'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'

/**
 * The MCP surface, checked against the running editor rather than the typings.
 *
 * `registerMcpServerDefinitionProvider` throws when the id it is given was
 * never contributed, so activating at all already proves the manifest entry and
 * `MCP_PROVIDER_ID` agree - but only if the extension is active, which is what
 * the added `onStartupFinished` is for and what the first test pins down.
 */
suite('MCP server definition provider', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('the editor exposes the MCP provider API this build needs', () => {
		assert.strictEqual(
			typeof vscode.lm.registerMcpServerDefinitionProvider,
			'function',
			'vscode.lm.registerMcpServerDefinitionProvider should exist'
		)
		assert.strictEqual(
			typeof vscode.McpStdioServerDefinition,
			'function',
			'vscode.McpStdioServerDefinition should be constructible'
		)
	})

	test('contributes the provider id the host registers', () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		const contributed = extension?.packageJSON.contributes
			.mcpServerDefinitionProviders as { id: string; label: string }[]

		assert.deepStrictEqual(
			contributed.map((entry) => entry.id),
			['editor-markdown-notes.text-tools']
		)
	})

	test('activates without a markdown file open', () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)

		assert.ok(
			extension?.packageJSON.activationEvents.includes('onStartupFinished'),
			'the server is undiscoverable until the extension activates'
		)
		assert.strictEqual(extension?.isActive, true)
	})

	test('ships the server entry the definition points at', () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		const entry = vscode.Uri.joinPath(
			extension!.extensionUri,
			'out',
			'mcp',
			'server.mjs'
		)

		assert.ok(
			existsSync(entry.fsPath),
			`${entry.fsPath} should exist - the definition spawns it by path`
		)
	})

	test('registers the command that accepts the server suggestions', async () => {
		const commands = await vscode.commands.getCommands(true)

		assert.ok(
			commands.includes('editor-markdown-notes.addDictionaryWords'),
			'the MCP server cannot write settings itself - see suggest_dictionary_words'
		)
	})
})
