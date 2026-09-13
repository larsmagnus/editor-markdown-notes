import * as vscode from 'vscode'

import { VIEW_TYPE } from '#src/host/constants'
import { companionPathFor } from '#src/lib/host/pdf-companion-path'
import type { Logger } from '#src/shared/logger'

/**
 * Extracts `uri` - or the active editor's file - into its markdown companion
 * file and opens that, never `uri` itself: a PDF's bytes can't be edited or
 * autosaved back through this editor, so the companion file is the only file
 * this command ever hands to `MarkdownEditorProvider`.
 *
 * A companion file already on disk is opened as-is rather than re-extracted,
 * so a reopen preserves whatever the author has since edited into it;
 * extraction only runs the first time a given PDF is opened this way.
 */
export async function openPdfAsNotes(
	uri: vscode.Uri | undefined,
	log: Logger
): Promise<void> {
	const target = uri ?? vscode.window.activeTextEditor?.document.uri

	if (!target) {
		vscode.window.showErrorMessage('No PDF file selected')
		return
	}

	const companionUri = target.with({ path: companionPathFor(target.path) })

	try {
		await vscode.workspace.fs.stat(companionUri)
		await vscode.commands.executeCommand(
			'vscode.openWith',
			companionUri,
			VIEW_TYPE
		)
		return
	} catch (error: unknown) {
		// Anything other than "it doesn't exist yet" - permissions, a flaky
		// filesystem - must not fall through to extraction, which would
		// overwrite whatever the author has already edited into that file.
		if (
			!(error instanceof vscode.FileSystemError) ||
			error.code !== 'FileNotFound'
		) {
			log.error(
				`Failed to check for an existing companion file: ${String(error)}`
			)
			vscode.window.showErrorMessage(
				`Editor Markdown Notes: Failed to open the companion file — ${String(error)}`
			)
			return
		}
	}

	try {
		const bytes = await vscode.workspace.fs.readFile(target)
		const {
			loadEsmBundle,
		}: {
			loadEsmBundle: (
				name: string
			) => Promise<{ extractPdfText: (bytes: Uint8Array) => Promise<string> }>
		} = require('./load-esm-bundle.cjs')
		const { extractPdfText } = await loadEsmBundle('pdf-extractor-bundle')

		const text = await extractPdfText(bytes)
		await vscode.workspace.fs.writeFile(companionUri, Buffer.from(text, 'utf8'))
		await vscode.commands.executeCommand(
			'vscode.openWith',
			companionUri,
			VIEW_TYPE
		)
	} catch (error: unknown) {
		log.error(`Failed to convert PDF to notes: ${String(error)}`)
		vscode.window.showErrorMessage(
			`Editor Markdown Notes: Failed to convert PDF — ${String(error)}`
		)
	}
}
