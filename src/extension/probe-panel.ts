import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'

import { isProbeEnabled } from './probe-enabled'
import { readSearchMatches } from './read-search-match'
import { recordProbe } from './reveal-probe'
import { reflect, snapshotWorkbench } from './reveal-probe-describe'

/**
 * Everything worth recording about one panel, from the moment it is resolved.
 *
 * Reads matches the clipboard-free way even though `readFocusedSearchMatch`
 * would name the focused one: the probe runs on *every* panel of every suite,
 * and a clipboard save/restore there both races itself and clobbers the
 * clipboard assertions in `search-clipboard-free.test.ts`. Which match was
 * focused is already answered - see `docs/search-reveal-investigation.md`.
 */
export function probePanel(
	panel: vscode.WebviewPanel,
	document: vscode.TextDocument,
	log: Logger
): vscode.Disposable {
	if (!isProbeEnabled()) return new vscode.Disposable(() => {})

	recordProbe(
		'resolveCustomTextEditor',
		{
			uri: document.uri,
			lineCount: document.lineCount,
			panel: reflect(panel),
			workbench: snapshotWorkbench(),
		},
		log
	)

	void probeSearchMatches('resolve', document.uri, log)

	return panel.onDidChangeViewState((event) => {
		recordProbe(
			'onDidChangeViewState',
			{ uri: document.uri, active: event.webviewPanel.active },
			log
		)

		if (event.webviewPanel.active) {
			void probeSearchMatches('viewState', document.uri, log)
		}
	})
}

async function probeSearchMatches(
	moment: string,
	uri: vscode.Uri,
	log: Logger
) {
	try {
		recordProbe(`searchMatches@${moment}`, await readSearchMatches(uri), log)
	} catch (error) {
		// Never let instrumentation take down a panel.
		log.warn(`Probe could not read search matches: ${String(error)}`)
	}
}
