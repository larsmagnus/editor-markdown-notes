/**
 * `text` with every line ending as `\n`.
 *
 * The webview only ever holds `\n`: a textarea reports `\r\n` as `\n`, so
 * offsets taken from the two disagree by one per line, and text the webview
 * syncs back would never match the CRLF document it came from. VS Code
 * converts inserted text to the document's own line ending, so the file keeps
 * its CRLF without the webview knowing about it.
 */
export function toLf(text: string): string {
	return text.replace(/\r\n?/g, '\n')
}
