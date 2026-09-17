import * as vscode from 'vscode'

import { openLinkTarget } from '#src/host/open-link-command'
import { PendingHeadingRevealStore } from '#src/host/pending-heading-reveal-store'
import { SessionsByUri } from '#src/host/sessions-by-uri'

/** Shared fixtures and helpers for the link-opening integration suites. */

const noopLog = { info: () => {}, warn: () => {}, error: () => {} }

export type LinkDeps = {
	panelsByUri: SessionsByUri<vscode.WebviewPanel>
	pendingReveals: PendingHeadingRevealStore
}

/** Fresh `openLinkTarget` dependencies for one test - never shared across
 *  tests, since both carry state a previous test's link click would leave
 *  behind. */
export function createLinkDeps(): LinkDeps {
	return {
		panelsByUri: new SessionsByUri<vscode.WebviewPanel>(),
		pendingReveals: new PendingHeadingRevealStore(),
	}
}

/** `openLinkTarget`, with `deps` and the shared `noopLog` already applied -
 *  every test needs the former passed through unchanged, and none want the
 *  latter's output cluttering the run. */
export function openTestLink(
	href: string,
	document: vscode.TextDocument,
	deps: LinkDeps
): Promise<void> {
	return openLinkTarget(
		href,
		document,
		deps.panelsByUri,
		deps.pendingReveals,
		noopLog
	)
}
