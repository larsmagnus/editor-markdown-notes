import * as vscode from 'vscode'

import type { Logger } from '../shared/logger'

import { isProbeEnabled } from './probe-enabled'
import { clearProbeEvents, recordProbe } from './reveal-probe'
import { describeEditor, describeTabInput } from './reveal-probe-describe'

/**
 * Global listeners covering every event that could plausibly fire around a
 * search-result open, so the transcript shows both what fired and in what order
 * relative to `resolveCustomTextEditor`.
 */
export function installProbeListeners(log: Logger): vscode.Disposable {
	if (!isProbeEnabled()) return new vscode.Disposable(() => {})

	clearProbeEvents()
	recordProbe('probe.installed', { version: vscode.version }, log)

	return vscode.Disposable.from(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			recordProbe('onDidChangeActiveTextEditor', describeEditor(editor), log)
		}),
		vscode.window.onDidChangeVisibleTextEditors((editors) => {
			recordProbe(
				'onDidChangeVisibleTextEditors',
				editors.map(describeEditor),
				log
			)
		}),
		vscode.window.onDidChangeTextEditorSelection((event) => {
			recordProbe(
				'onDidChangeTextEditorSelection',
				{
					uri: event.textEditor.document.uri,
					kind: event.kind,
					selections: event.selections,
				},
				log
			)
		}),
		vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
			recordProbe(
				'onDidChangeTextEditorVisibleRanges',
				{
					uri: event.textEditor.document.uri,
					visibleRanges: event.visibleRanges,
				},
				log
			)
		}),
		vscode.workspace.onDidOpenTextDocument((document) => {
			recordProbe(
				'onDidOpenTextDocument',
				{ uri: document.uri, languageId: document.languageId },
				log
			)
		}),
		vscode.window.tabGroups.onDidChangeTabs((event) => {
			recordProbe(
				'onDidChangeTabs',
				{
					opened: event.opened.map((tab) => describeTabInput(tab.input)),
					changed: event.changed.map((tab) => describeTabInput(tab.input)),
					closed: event.closed.map((tab) => describeTabInput(tab.input)),
				},
				log
			)
		})
	)
}
