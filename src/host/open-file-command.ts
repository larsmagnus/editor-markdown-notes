import * as path from 'path'

import * as vscode from 'vscode'

import { VIEW_TYPE } from '#src/host/constants'
import { isMarkdownFile } from '#src/lib/host/markdown-file-extensions'

/**
 * Opens `uri` — or the active editor's file — with our custom editor.
 *
 * The menu `when` clauses already restrict this to markdown, but the command is
 * also reachable from a keybinding, where nothing has vetted the target.
 */
export function openFile(uri?: vscode.Uri) {
	const activeDocument = vscode.window.activeTextEditor?.document
	const target = uri ?? activeDocument?.uri

	if (!target) {
		vscode.window.showErrorMessage('No markdown file selected')
		return
	}

	const isMarkdown =
		isMarkdownFile(target.path) ||
		(target === activeDocument?.uri && activeDocument.languageId === 'markdown')

	if (!isMarkdown) {
		vscode.window.showErrorMessage(
			`Editor Markdown Notes cannot open ${path.basename(target.path)} — it is not a markdown file`
		)
		return
	}

	return vscode.commands.executeCommand('vscode.openWith', target, VIEW_TYPE)
}
