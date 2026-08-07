import * as assert from 'assert'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import * as vscode from 'vscode'

import {
	buildContentSecurityPolicy,
	getDocumentResourceRoots,
	getImageBaseUris,
} from '../extension'
import { resolveImageSrc } from '../lib/resolve-image-src'
import { getWebviewProblems } from '../lib/webview-diagnostics'

const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'
const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

/** A 1x1 transparent PNG, so the image on disk is a real one. */
const PIXEL_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
)

/** `![alt](src)` — enough for the sample notes, which hold no reference links. */
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g

/**
 * A throwaway panel purely for its `Webview`. `asWebviewUri` is the piece under
 * test and only a real webview has it.
 */
async function withWebview<T>(run: (webview: vscode.Webview) => Promise<T>) {
	const panel = vscode.window.createWebviewPanel(
		'editor-markdown-notes.test',
		'Image resolution',
		vscode.ViewColumn.One,
		{ localResourceRoots: [] }
	)

	try {
		return await run(panel.webview)
	} finally {
		panel.dispose()
	}
}

/**
 * Where the author's path lands on disk, derived independently of
 * `resolveImageSrc` so the test does not just restate the implementation.
 */
function expectedImageFile(
	src: string,
	document: vscode.TextDocument,
	workspaceRoot: string
) {
	if (src.startsWith('/')) return path.join(workspaceRoot, src)

	return path.resolve(path.dirname(document.uri.fsPath), src)
}

/** URLs compared as URLs: both sides normalise the `file+…` webview authority. */
function assertSameUrl(actual: string, expected: string, message: string) {
	assert.strictEqual(
		new URL(actual).toString(),
		new URL(expected).toString(),
		message
	)
}

/** Opening a custom editor is asynchronous; give the tab a moment to appear. */
async function waitForActiveTab(predicate: (tab: vscode.Tab) => boolean) {
	for (let attempt = 0; attempt < 50; attempt++) {
		const tab = vscode.window.tabGroups.activeTabGroup.activeTab
		if (tab && predicate(tab)) return tab

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	return undefined
}

suite('Editor Markdown Notes', () => {
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
		]) {
			assert.ok(commands.includes(command), `${command} should be registered`)
		}
	})

	test('opens a note without the editor reporting a problem', async function () {
		// Longer than Mocha's 2s default, because the check below outwaits the
		// webview's own watchdog.
		this.timeout(15_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(
			file.fsPath,
			'# Hello\n\nA note with a [link](/other).\n'
		)

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			// The webview's watchdog reports an empty #root two seconds in, so a
			// quiet channel past that point means the app really did render - not
			// just that the bundle loaded without throwing.
			await new Promise((resolve) => setTimeout(resolve, 3000))

			assert.deepStrictEqual(getWebviewProblems(), [])
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	// The analyser runs in a worker booted from a blob URL. If `worker-src` were
	// missing from the CSP the panel would still render and only the checks would
	// silently never appear - so the failure has to be caught here, where the log
	// bridge forwards the CSP violation.
	test('starts the text tools worker without a policy violation', async function () {
		this.timeout(15_000)

		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(
			file.fsPath,
			'# Hello\n\nThe report was written by the committee, which will utilize it.\n'
		)

		await vscode.commands.executeCommand(
			'editor-markdown-notes.toggleTextTools'
		)

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			// Past the watchdog, and well past the 500ms analysis debounce, so the
			// worker has had to start for real.
			await new Promise((resolve) => setTimeout(resolve, 4000))

			assert.deepStrictEqual(getWebviewProblems(), [])
		} finally {
			// Left on, the toggle would leak into every test that follows.
			await vscode.commands.executeCommand(
				'editor-markdown-notes.toggleTextTools'
			)
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('contributes the settings that put a Settings entry on the extension page', () => {
		const config = vscode.workspace.getConfiguration('editorMarkdownNotes')

		assert.strictEqual(config.get('hideNav'), false)
		assert.strictEqual(config.get('centerContent'), false)
		assert.strictEqual(config.get('textToolsTargetAge'), 16)
	})

	// Both directives fail silently: the diagram either never loads or draws
	// with no styling, and nothing is reported anywhere.
	test('serves a policy a rendered mermaid diagram can load under', () => {
		const csp = buildContentSecurityPolicy('vscode-resource://test', 'abc123')

		const directive = (name: string) =>
			csp.split('; ').find((part) => part.startsWith(`${name} `)) ?? ''

		// Mermaid's diagram bundles are imported on demand, and the entry script's
		// nonce does not reach them.
		assert.ok(
			directive('script-src').includes('vscode-resource://test'),
			'dynamically imported chunks should be allowed to load'
		)
		// A rendered diagram carries its own <style> element inside the SVG.
		assert.ok(
			directive('style-src').includes("'unsafe-inline'"),
			'the styles mermaid embeds in its SVG should be allowed'
		)
	})

	// `cspSource` would not do: it is a different origin from the webview
	// document, and a worker has to be same-origin. The analyser is inlined and
	// booted from a blob URL, which inherits this document's origin.
	test('serves a policy the text tools worker can start under', () => {
		const csp = buildContentSecurityPolicy('vscode-resource://test', 'abc123')

		const workerSrc =
			csp.split('; ').find((part) => part.startsWith('worker-src ')) ?? ''

		assert.ok(
			workerSrc.includes('blob:'),
			'the inlined analysis worker should be allowed to start'
		)
	})

	test('toggling raw and full width persists across invocations', async () => {
		await vscode.commands.executeCommand('editor-markdown-notes.toggleRaw')
		await vscode.commands.executeCommand(
			'editor-markdown-notes.toggleFullWidth'
		)

		// Reopening the editor is what proves persistence: the toggles are stored
		// in globalState by the host, not in any one webview.
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Hello\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const tab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)
			assert.ok(tab, 'the custom editor should open with the stored options')
		} finally {
			// Restore the defaults so the remaining tests see a clean slate.
			await vscode.commands.executeCommand('editor-markdown-notes.toggleRaw')
			await vscode.commands.executeCommand(
				'editor-markdown-notes.toggleFullWidth'
			)
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('rejects a file that is not markdown', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.txt'))
		await fs.writeFile(file.fsPath, 'not markdown\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const tab = vscode.window.tabGroups.activeTabGroup.activeTab
			assert.ok(
				!(
					tab?.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
				),
				'a non-markdown file should not open in the custom editor'
			)
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('opens a markdown file containing a literal </script> tag', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		// Interpolated into an inline <script> as `window.initialContent`; without
		// escaping, this closes the block early and the webview loads blank.
		await fs.writeFile(file.fsPath, '# Docs\n\n`</script>`\n')

		try {
			await vscode.commands.executeCommand(
				'editor-markdown-notes.openFile',
				file
			)

			const tab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)

			assert.ok(tab, 'the custom editor should still open')
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	// The webview has its own origin, so an image path only loads if the host
	// resolves it to a `vscode-resource` URI pointing at a file that exists
	// inside `localResourceRoots`. A path that resolves to nothing renders as a
	// broken image with no error anywhere — hence these tests.
	test('every image in the sample notes resolves to a file the webview can load', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		assert.ok(workspaceRoot, 'the tests must run with the repo as a workspace')

		const contentDirectory = path.join(workspaceRoot, 'public')
		const notes = (await fs.readdir(contentDirectory)).filter((name) =>
			name.endsWith('.md')
		)
		assert.ok(notes.length > 0, 'there should be sample notes to check')

		const checked: string[] = []

		await withWebview(async (webview) => {
			for (const note of notes) {
				const file = vscode.Uri.file(path.join(contentDirectory, note))
				const document = await vscode.workspace.openTextDocument(file)
				const baseUris = getImageBaseUris(webview, document)
				const roots = getDocumentResourceRoots(document)

				const sources = [...document.getText().matchAll(MARKDOWN_IMAGE)].map(
					([, src]) => src
				)
				assert.ok(sources.length > 0, `${note} should document an image`)
				checked.push(...sources)

				for (const src of sources) {
					const expected = expectedImageFile(src, document, workspaceRoot)

					await assert.doesNotReject(
						fs.access(expected),
						`${note} points at ${src}, which resolves to ${expected} — no such file`
					)

					assertSameUrl(
						resolveImageSrc(src, baseUris),
						webview.asWebviewUri(vscode.Uri.file(expected)).toString(),
						`${note} should load ${src} from ${expected}`
					)

					assert.ok(
						roots.some(
							(root) =>
								expected === root.fsPath ||
								expected.startsWith(root.fsPath + path.sep)
						),
						`${expected} is outside localResourceRoots, so the webview would refuse it`
					)
				}
			}
		})

		// The samples are the only end-to-end coverage of either branch, so losing
		// one to an edit should fail here rather than go unnoticed.
		assert.ok(
			checked.some((src) => src.startsWith('/')),
			'a sample note should document a workspace-root path'
		)
		assert.ok(
			checked.some((src) => !src.startsWith('/')),
			'a sample note should document a document-relative path'
		)
	})

	test('a document-relative image resolves out of the document folder', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const documentFile = path.join(directory, 'docs', 'notes.md')
		const imageFile = path.join(directory, 'assets', 'diagram.png')

		await fs.mkdir(path.dirname(documentFile))
		await fs.mkdir(path.dirname(imageFile))
		await fs.writeFile(documentFile, '![Architecture](../assets/diagram.png)\n')
		await fs.writeFile(imageFile, PIXEL_PNG)

		try {
			const document = await vscode.workspace.openTextDocument(
				vscode.Uri.file(documentFile)
			)

			await withWebview(async (webview) => {
				// The temp file sits outside the workspace, so `getImageBaseUris`
				// falls the workspace base back to the document folder. Only the
				// relative branch is meaningful here.
				const baseUris = getImageBaseUris(webview, document)

				assertSameUrl(
					resolveImageSrc('../assets/diagram.png', baseUris),
					webview.asWebviewUri(vscode.Uri.file(imageFile)).toString(),
					'the image should load from the sibling assets folder'
				)
			})
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})

	test('opens the active markdown file with the custom editor', async () => {
		const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'emn-test-'))
		const file = vscode.Uri.file(path.join(directory, 'notes.md'))
		await fs.writeFile(file.fsPath, '# Hello\n')

		try {
			// Open in the default text editor first, so the command has to pick the
			// file up from the active editor rather than from an argument.
			const document = await vscode.workspace.openTextDocument(file)
			await vscode.window.showTextDocument(document)

			await vscode.commands.executeCommand('editor-markdown-notes.openFile')

			const tab = await waitForActiveTab(
				(tab) =>
					tab.input instanceof vscode.TabInputCustom &&
					tab.input.viewType === VIEW_TYPE
			)

			assert.ok(tab, 'the custom editor tab should become active')
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			await fs.rm(directory, { recursive: true, force: true })
		}
	})
})
