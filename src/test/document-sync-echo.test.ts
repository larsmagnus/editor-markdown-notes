import * as assert from 'assert'

import * as vscode from 'vscode'

import { DocumentWriter } from '#src/host/document-updates'
import { log, openTempNote } from '#src/test/temp-note-support'

suite('Recognising a sync when it comes back', () => {
	/**
	 * VS Code fires the change event while `applyEdit` is still pending, so a
	 * write that only counts as its own once the edit resolves is reported to
	 * the webview as an outside change - which rebuilds the live editor over
	 * whatever the author typed during the round trip.
	 */
	test('recognises its own write while VS Code is still applying it', async () => {
		const writer = new DocumentWriter(log)
		const document = await openTempNote('# Roadmap\n')

		const seenAsOwn: boolean[] = []
		const subscription = vscode.workspace.onDidChangeTextDocument((event) => {
			if (event.document.uri.toString() !== document.uri.toString()) return
			seenAsOwn.push(writer.matchesLastWrite(event.document.getText()))
		})

		try {
			await writer.write(document, '# Roadmap 2026\n')

			// One event for the text, another for the dirty flag it raises.
			assert.ok(seenAsOwn.length > 0)
			assert.ok(
				seenAsOwn.every(Boolean),
				`seen as own: ${seenAsOwn.join(', ')}`
			)
		} finally {
			subscription.dispose()
		}
	})
})
