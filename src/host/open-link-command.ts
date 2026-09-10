import * as path from 'path'

import * as vscode from 'vscode'

import { VIEW_TYPE } from '#src/host/constants'
import { deliverHeadingReveal } from '#src/host/heading-reveal-delivery'
import type { PendingHeadingRevealStore } from '#src/host/pending-heading-reveal-store'
import { resolveLinkTarget } from '#src/host/resolve-link-target'
import type { SessionsByUri } from '#src/host/sessions-by-uri'
import { splitHrefHash } from '#src/lib/host/split-href-hash'
import type { Logger } from '#src/shared/logger'

/**
 * Opens a relative link's target, resolved against `document`: our own
 * editor for a `.md` file, `vscode.open` (best-effort, VS Code picks the
 * viewer) for anything else. Both reuse a single preview tab per VS Code's
 * own file-link convention.
 *
 * A `#hash` on the href is delivered as a heading reveal once the target is
 * open - see `heading-reveal-delivery.ts` for the already-open-panel vs.
 * not-yet-open branch. Only for a `.md` target: `resolveCustomTextEditor`
 * (the only reader of a not-yet-delivered reveal) never fires for anything
 * else, so queuing one there would sit in `pendingReveals` forever.
 */
export async function openLinkTarget(
	href: string,
	document: vscode.TextDocument,
	panelsByUri: SessionsByUri<vscode.WebviewPanel>,
	pendingReveals: PendingHeadingRevealStore,
	log: Logger
): Promise<void> {
	const result = await resolveLinkTarget(href, document)

	if ('error' in result) {
		vscode.window.showErrorMessage(`Editor Markdown Notes: ${result.error}`)
		return
	}

	const { uri } = result
	const isMarkdown = uri.path.toLowerCase().endsWith('.md')

	// Delivered before opening, not after: a target with no panel open yet is
	// answered by queuing the hash in `pendingReveals` for
	// `resolveCustomTextEditor` to pick up, and that only works ahead of the
	// open call below - it reads the queue while building the very panel this
	// triggers, so queuing it afterward is always one open too late.
	const { hash } = splitHrefHash(href)
	if (hash && isMarkdown) {
		deliverHeadingReveal(uri, hash, panelsByUri, pendingReveals)
	}

	try {
		if (isMarkdown) {
			await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, {
				preview: true,
			})
		} else {
			await vscode.commands.executeCommand('vscode.open', uri, {
				preview: true,
			})
		}
	} catch (error: unknown) {
		log.error(
			`Failed to open link target ${path.basename(uri.fsPath)}: ${String(error)}`
		)
	}
}
