import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import { resolveLinkTarget } from '#src/host/resolve-link-target'

suite('Resolving a link target', () => {
	test('resolves a relative link against the document folder', async () => {
		const workspace = vscode.workspace.workspaceFolders?.[0]
		assert.ok(workspace, 'expected a workspace folder')

		const note = vscode.Uri.joinPath(workspace.uri, 'public', 'other-note.md')
		const document = await vscode.workspace.openTextDocument(note)

		const result = await resolveLinkTarget('./notes.md', document)

		assert.ok('uri' in result, 'expected a resolved uri')
		assert.strictEqual(
			result.uri.fsPath,
			vscode.Uri.joinPath(workspace.uri, 'public', 'notes.md').fsPath
		)
	})

	test('resolves a leading-slash link against the workspace root', async () => {
		const workspace = vscode.workspace.workspaceFolders?.[0]
		assert.ok(workspace, 'expected a workspace folder')

		const note = vscode.Uri.joinPath(workspace.uri, 'public', 'other-note.md')
		const document = await vscode.workspace.openTextDocument(note)

		const result = await resolveLinkTarget('/public/notes.md', document)

		assert.ok('uri' in result, 'expected a resolved uri')
		assert.strictEqual(
			result.uri.fsPath,
			vscode.Uri.joinPath(workspace.uri, 'public', 'notes.md').fsPath
		)
	})

	test('errors on a leading-slash link from a document outside any workspace folder', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const file = vscode.Uri.file(path.join(directory, 'notes.md'))
			await fs.writeFile(file.fsPath, '# Notes\n')
			const document = await vscode.workspace.openTextDocument(file)

			const result = await resolveLinkTarget('/notes.md', document)

			assert.ok('error' in result, 'expected an error, got a resolved uri')
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('resolves a relative link between two files outside any workspace', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			const target = vscode.Uri.file(path.join(directory, 'target.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			await fs.writeFile(target.fsPath, '# Target\n')
			const document = await vscode.workspace.openTextDocument(source)

			const result = await resolveLinkTarget('./target.md', document)

			assert.ok('uri' in result, 'expected a resolved uri')
			assert.strictEqual(result.uri.fsPath, target.fsPath)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('errors on a target that does not exist', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			const document = await vscode.workspace.openTextDocument(source)

			const result = await resolveLinkTarget('./missing.md', document)

			assert.ok('error' in result, 'expected an error, got a resolved uri')
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('decodes URL-encoded characters in the path', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-link-test-'))
		try {
			const source = vscode.Uri.file(path.join(directory, 'source.md'))
			const target = vscode.Uri.file(path.join(directory, 'my notes.md'))
			await fs.writeFile(source.fsPath, '# Source\n')
			await fs.writeFile(target.fsPath, '# Target\n')
			const document = await vscode.workspace.openTextDocument(source)

			const result = await resolveLinkTarget('./my%20notes.md', document)

			assert.ok('uri' in result, 'expected a resolved uri')
			assert.strictEqual(result.uri.fsPath, target.fsPath)
		} finally {
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('resolves a link carrying a hash, ignoring the hash', async () => {
		const workspace = vscode.workspace.workspaceFolders?.[0]
		assert.ok(workspace, 'expected a workspace folder')

		const note = vscode.Uri.joinPath(workspace.uri, 'public', 'other-note.md')
		const document = await vscode.workspace.openTextDocument(note)

		const result = await resolveLinkTarget('./notes.md#heading-2', document)

		assert.ok('uri' in result, 'expected a resolved uri')
		assert.strictEqual(
			result.uri.fsPath,
			vscode.Uri.joinPath(workspace.uri, 'public', 'notes.md').fsPath
		)
	})
})
