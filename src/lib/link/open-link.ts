import { getVSCodeApi } from '#src/lib/vscode-api'

/**
 * Asks the host to open a relative link's target. A no-op outside VS Code -
 * the standalone build has nowhere to open a workspace file, same as today.
 */
export function openLink(href: string): void {
	getVSCodeApi()?.postMessage({ type: 'openLink', href })
}
