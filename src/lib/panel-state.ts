import { webviewPanelStateSchema } from '@/lib/schemas'
import { getVSCodeApi } from '@/lib/vscode-api'

export type WebviewPanelState = {
	/** How far down the note was scrolled, or absent if it never was. */
	scrollTop?: number
	/** Whether the injected search reveal has already been acted on. */
	searchRevealConsumed?: boolean
}

/**
 * The panel's own state, the one thing that survives VS Code destroying the
 * webview for a backgrounded tab.
 *
 * The page is rebuilt from HTML frozen when the note first opened, so anything
 * that must not happen twice has to be recorded here rather than inferred from
 * the injected globals - those come back looking brand new every time.
 *
 * Read and written as a whole, because `setState` replaces rather than merges:
 * writing one field on its own silently drops the other.
 */
export function readPanelState(): WebviewPanelState {
	return webviewPanelStateSchema.parse(getVSCodeApi()?.getState())
}

export function updatePanelState(patch: WebviewPanelState) {
	getVSCodeApi()?.setState({ ...readPanelState(), ...patch })
}
