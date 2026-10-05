import * as assert from 'assert'

import * as vscode from 'vscode'

import {
	buildDefaultNoteIndex,
	findEntry,
} from '#src/test/note-index-test-support'
import { EXTENSION_ID } from '#src/test/tab-test-support'

suite('Workspace note index exclusions', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()
	})

	test('leaves out notes inside node_modules and build output', async () => {
		const { entries } = await buildDefaultNoteIndex()

		const excluded = entries.filter((entry) =>
			/(^|\/)(node_modules|out|dist|\.git|\.vscode-test)(\/|$)/.test(
				entry.directory
			)
		)

		assert.ok(findEntry(entries, 'README.md'), 'README.md is still indexed')
		assert.deepStrictEqual(
			excluded.map((entry) => `${entry.directory}/${entry.fileName}`),
			[]
		)
	})

	test('leaves out folders listed in the index exclude setting', async () => {
		const config = vscode.workspace.getConfiguration('editorMarkdownNotes')
		await config.update(
			'index.exclude',
			['**/public/**'],
			vscode.ConfigurationTarget.Global
		)

		try {
			const { entries } = await buildDefaultNoteIndex()

			assert.strictEqual(findEntry(entries, 'public', 'notes.md'), undefined)
			assert.ok(findEntry(entries, 'README.md'), 'README.md is still indexed')
		} finally {
			await config.update(
				'index.exclude',
				undefined,
				vscode.ConfigurationTarget.Global
			)
		}
	})

	test('leaves out folders hidden through files.exclude', async () => {
		const config = vscode.workspace.getConfiguration('files')
		const previous = config.inspect<Record<string, boolean>>('exclude')
		await config.update(
			'exclude',
			{ ...previous?.globalValue, '**/public': true },
			vscode.ConfigurationTarget.Global
		)

		try {
			const { entries } = await buildDefaultNoteIndex()

			assert.strictEqual(findEntry(entries, 'public', 'notes.md'), undefined)
		} finally {
			await config.update(
				'exclude',
				previous?.globalValue,
				vscode.ConfigurationTarget.Global
			)
		}
	})

	test('honours a files.exclude pattern with a brace group', async () => {
		const config = vscode.workspace.getConfiguration('files')
		const previous = config.inspect<Record<string, boolean>>('exclude')
		await config.update(
			'exclude',
			{ ...previous?.globalValue, '**/public/*.{md,mdown}': true },
			vscode.ConfigurationTarget.Global
		)

		try {
			const { entries } = await buildDefaultNoteIndex()

			assert.strictEqual(findEntry(entries, 'public', 'notes.md'), undefined)
			assert.strictEqual(
				findEntry(entries, 'public', 'sample-c.mdown'),
				undefined
			)
			assert.ok(findEntry(entries, 'public', 'sample-b.markdown'))
		} finally {
			await config.update(
				'exclude',
				previous?.globalValue,
				vscode.ConfigurationTarget.Global
			)
		}
	})
})
