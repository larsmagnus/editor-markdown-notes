import { getVSCodeApi } from '@/lib/vscode-api'

/** Copies `text`, tolerating a webview with no clipboard permission. */
export function copyToClipboard(text: string) {
	void navigator.clipboard?.writeText(text)
}

/**
 * Hands one diagram to Claude: inside VS Code by asking the host to open a
 * terminal, and standalone by the only route a browser tab has - the clipboard
 * plus claude.ai, the same fallback `ButtonCopy` takes.
 *
 * The source travels with the host message because the host knows which file
 * this is but nothing about which of its diagrams was asked about.
 *
 * Returns whether the clipboard was written, which the caller owes the reader
 * an acknowledgement of - replacing what someone has copied is not something
 * to do silently.
 */
export function openDiagramInClaude(
	code: string,
	isVSCodeContext: boolean
): boolean {
	if (isVSCodeContext) {
		getVSCodeApi()?.postMessage({ type: 'openClaudeTerminal', content: code })
		return false
	}

	copyToClipboard(code)
	window.open('https://claude.ai', '_blank', 'noopener,noreferrer')
	return true
}
