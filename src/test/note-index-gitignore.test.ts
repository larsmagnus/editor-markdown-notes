import * as assert from 'assert'

import * as vscode from 'vscode'

import { buildNoteIndex } from '#src/host/note-index'
import {
	DEFAULT_NOTE_INDEX_FILTERS,
	findEntry,
	workspaceUri,
} from '#src/test/note-index-test-support'
import { EXTENSION_ID } from '#src/test/tab-test-support'

/**
 * This repo's own `.gitignore` supplies the fixtures: `blob-report/` is
 * ignored without being in the built-in exclusions, and `.claude/worktrees` is
 * ignored but is an AI tool's directory.
 */
const IGNORED_NOTE = ['blob-report', 'fixture-note.md']
const IGNORED_AI_TOOL_NOTE = ['.claude', 'worktrees', 'fixture-note.md']

suite('Workspace note index and .gitignore', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID)
		assert.ok(extension, `Extension ${EXTENSION_ID} is not installed`)
		await extension.activate()

		for (const segments of [IGNORED_NOTE, IGNORED_AI_TOOL_NOTE]) {
			await vscode.workspace.fs.writeFile(
				workspaceUri(...segments),
				new TextEncoder().encode('# Fixture note\n')
			)
		}
	})

	suiteTeardown(async () => {
		await vscode.workspace.fs.delete(workspaceUri('blob-report'), {
			recursive: true,
			useTrash: false,
		})
		await vscode.workspace.fs.delete(workspaceUri(...IGNORED_AI_TOOL_NOTE), {
			useTrash: false,
		})
	})

	test('leaves out a gitignored note', async () => {
		const { entries } = await buildNoteIndex(
			workspaceUri('README.md'),
			DEFAULT_NOTE_INDEX_FILTERS
		)

		assert.strictEqual(findEntry(entries, ...IGNORED_NOTE), undefined)
		assert.ok(findEntry(entries, 'README.md'), 'README.md is still indexed')
	})

	test('lists notes inside .claude', async () => {
		const { entries } = await buildNoteIndex(
			workspaceUri('README.md'),
			DEFAULT_NOTE_INDEX_FILTERS
		)

		assert.ok(
			findEntry(entries, '.claude', 'rules', 'testing.md'),
			'.claude/rules/testing.md should be indexed'
		)
	})

	test('keeps a gitignored note in an AI-tool folder', async () => {
		const { entries } = await buildNoteIndex(
			workspaceUri('README.md'),
			DEFAULT_NOTE_INDEX_FILTERS
		)

		assert.ok(findEntry(entries, ...IGNORED_AI_TOOL_NOTE))
	})

	test('leaves out a gitignored AI-tool note once AI-tool folders are not shown', async () => {
		const { entries } = await buildNoteIndex(workspaceUri('README.md'), {
			...DEFAULT_NOTE_INDEX_FILTERS,
			showAiToolFolders: false,
		})

		assert.strictEqual(findEntry(entries, ...IGNORED_AI_TOOL_NOTE), undefined)
	})

	test('lists a gitignored note once .gitignore is not respected', async () => {
		const { entries } = await buildNoteIndex(workspaceUri('README.md'), {
			...DEFAULT_NOTE_INDEX_FILTERS,
			respectGitignore: false,
		})

		assert.ok(findEntry(entries, ...IGNORED_NOTE))
	})

	test('still leaves out node_modules when .gitignore is not respected', async () => {
		const { entries } = await buildNoteIndex(workspaceUri('README.md'), {
			...DEFAULT_NOTE_INDEX_FILTERS,
			respectGitignore: false,
		})

		assert.deepStrictEqual(
			entries.filter((entry) => entry.directory.includes('node_modules')),
			[]
		)
	})

	test('leaves out a hidden directory but still offers it for showing again', async () => {
		const { entries, directories, hiddenDirectories } = await buildNoteIndex(
			workspaceUri('README.md'),
			{ ...DEFAULT_NOTE_INDEX_FILTERS, hiddenDirectories: ['public'] }
		)

		assert.strictEqual(findEntry(entries, 'public', 'notes.md'), undefined)
		assert.ok(directories.some(({ directory }) => directory === 'public'))
		assert.deepStrictEqual(hiddenDirectories, ['public'])
	})

	test('reports git as available inside a repository', async () => {
		const { gitUnavailable } = await buildNoteIndex(
			workspaceUri('README.md'),
			DEFAULT_NOTE_INDEX_FILTERS
		)

		assert.strictEqual(gitUnavailable, false)
	})
})
