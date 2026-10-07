import * as vscode from 'vscode'

import type { TextReplacement } from '#src/host/minimal-edit'

/** The line and column of `offset` in `text`. */
function positionInLfText(text: string, offset: number): vscode.Position {
	const before = text.slice(0, offset)
	const line = before.split('\n').length - 1
	return new vscode.Position(line, offset - (before.lastIndexOf('\n') + 1))
}

/**
 * Where `replacement`, computed against the LF form of a document's text,
 * lands in that document - as lines and columns, which carry over to the
 * same characters of a CRLF document where raw offsets would not.
 */
export function rangeInLfText(
	text: string,
	replacement: TextReplacement
): vscode.Range {
	return new vscode.Range(
		positionInLfText(text, replacement.start),
		positionInLfText(text, replacement.end)
	)
}
