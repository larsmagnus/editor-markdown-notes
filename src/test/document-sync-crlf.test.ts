import * as assert from 'assert'

import * as vscode from 'vscode'

import { DocumentWriter } from '#src/host/document-updates'
import { log, openTempNote } from '#src/test/temp-note-support'

suite('Syncing a CRLF note', () => {
	test('keeps a CRLF note CRLF when the webview syncs plain newlines', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\r\n\r\nShip it.\r\n')

		await writer.write(document, '# Roadmap\n\nShip it. Today.\n')

		assert.strictEqual(
			document.getText(),
			'# Roadmap\r\n\r\nShip it. Today.\r\n'
		)
		assert.strictEqual(writer.matchesLastWrite(document.getText()), true)
	})

	test('edits only the changed span of a CRLF note', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote(
			'# Roadmap\r\n\r\nShip it today.\r\n\r\nDone.\r\n'
		)

		const changes: vscode.TextDocumentContentChangeEvent[] = []
		const subscription = vscode.workspace.onDidChangeTextDocument((event) => {
			if (event.document.uri.toString() !== document.uri.toString()) return
			changes.push(...event.contentChanges)
		})

		try {
			await writer.write(document, '# Roadmap\n\nShip it tomorrow.\n\nDone.\n')

			assert.strictEqual(changes.length, 1)
			assert.ok(changes[0].rangeLength < 10)
		} finally {
			subscription.dispose()
		}
	})
})
