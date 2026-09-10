import * as vscode from 'vscode'

import { openLinkTarget } from '#src/host/open-link-command'
import { PendingHeadingRevealStore } from '#src/host/pending-heading-reveal-store'
import { SessionsByUri } from '#src/host/sessions-by-uri'

/** Shared fixtures and helpers for the link-opening integration suites. */

export const EXTENSION_ID = 'larsmagnus.editor-markdown-notes'
const VIEW_TYPE = 'editor-markdown-notes.markdownEditor'

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

/** Opening a tab is asynchronous; give it a moment to appear. */
export async function waitForActiveTab(
	predicate: (tab: vscode.Tab) => boolean
) {
	for (let attempt = 0; attempt < 50; attempt++) {
		const tab = vscode.window.tabGroups.activeTabGroup.activeTab
		if (tab && predicate(tab)) return tab

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	return undefined
}

export function isCustomEditorTab(tab: vscode.Tab): boolean {
	return (
		tab.input instanceof vscode.TabInputCustom &&
		tab.input.viewType === VIEW_TYPE
	)
}
