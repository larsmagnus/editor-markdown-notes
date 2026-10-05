import type * as vscode from 'vscode'

import { buildNoteIndex } from '#src/host/note-index'
import type { SettingsStore } from '#src/host/settings-store'
import type { Logger } from '#src/shared/logger'
import type { HostToWebview, NoteIndexRequest } from '#src/shared/messages'

type NoteIndexDependencies = {
	panel: vscode.WebviewPanel
	document: vscode.TextDocument
	store: SettingsStore
	log: Logger
}

/**
 * Answers one `getNoteIndex` to the asking panel alone.
 *
 * A failure still gets a reply, or the dialog waits on its spinner forever. A
 * request that names hidden directories is also the author changing them, so
 * they are stored here; one that does not gets what was stored.
 */
export function createNoteIndexAnswerer({
	panel,
	document,
	store,
	log,
}: NoteIndexDependencies) {
	return async function answerNoteIndexRequest({
		requestId,
		...request
	}: NoteIndexRequest & { requestId: number }) {
		const reply: HostToWebview = await resolveHiddenDirectories(
			store,
			request.hiddenDirectories
		)
			.then((hiddenDirectories) =>
				buildNoteIndex(document.uri, { ...request, hiddenDirectories })
			)
			.then(
				(index) => ({ type: 'noteIndex', requestId, ...index }),
				(error: unknown) => {
					log.error(`Could not build the note index: ${String(error)}`)
					return { type: 'noteIndexFailed', requestId }
				}
			)

		void panel.webview.postMessage(reply)
	}
}

async function resolveHiddenDirectories(
	store: SettingsStore,
	requested: string[] | undefined
): Promise<string[]> {
	if (!requested) return store.getHiddenNoteDirectories()

	await store.setHiddenNoteDirectories(requested)
	return requested
}
