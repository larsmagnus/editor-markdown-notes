import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'

import { resolvePickedImagePath } from './resolve-picked-image-path'
import type { SettingsStore } from './settings-store'

/**
 * Shows the native file dialog and resolves the path to reply with - `null`
 * on a cancelled dialog or a failure, never a rejection. The caller has no
 * timeout waiting for this, so a failure that went unanswered would hang it
 * forever; logging and falling back to `null` is what keeps every call path
 * replying exactly once.
 */
export async function pickImagePath(
	document: vscode.TextDocument,
	store: SettingsStore,
	log: Logger
): Promise<string | null> {
	try {
		const picked = await vscode.window.showOpenDialog({
			canSelectMany: false,
			filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
		})

		if (!picked?.[0]) return null

		return await resolvePickedImagePath(
			document,
			picked[0],
			store.getSettings().imageCopyDirectory
		)
	} catch (error) {
		log.error(`Failed to pick an image: ${String(error)}`)
		return null
	}
}
