import { readPanelState, updatePanelState } from '@/lib/panel-state'
import { scrollTopSchema } from '@/lib/schemas'
import { getVSCodeApi, isVSCodeWebview } from '@/lib/vscode-api'
import { EXTENSION_ID } from '@/shared/constants'

const STORAGE_KEY_PREFIX = `${EXTENSION_ID}:scroll-top:`

/**
 * Where a note was last scrolled to, from whichever side remembers it.
 *
 * In VSCode there are two, because the webview is destroyed in two different
 * ways. Closing the tab leaves only the host, which injects
 * `window.initialScrollTop` ahead of the bundle. Backgrounding the tab destroys
 * the webview too, but VSCode reloads it from the HTML it already holds - whose
 * injected offset is frozen at whatever it was when the note first opened - so
 * the panel's own `setState`, which VSCode preserves across exactly that cycle,
 * is what carries the newer value and is read first.
 *
 * Standalone there is no host, and `sessionStorage` matches the same
 * session-scoped lifetime.
 */
export function readScrollTop(fileName: string): number {
	if (!isVSCodeWebview())
		return scrollTopSchema.parse(readStoredScrollTop(fileName))

	const { scrollTop } = readPanelState()
	if (scrollTop !== undefined) return scrollTop

	return scrollTopSchema.parse(window.initialScrollTop)
}

export function writeScrollTop(fileName: string, scrollTop: number) {
	if (isVSCodeWebview()) {
		// Both sides, since neither survives what the other does: `setState` dies
		// with the tab, and the host's copy is only re-read when a panel is built
		// from scratch.
		updatePanelState({ scrollTop })
		getVSCodeApi()?.postMessage({ type: 'setScrollTop', scrollTop })
		return
	}

	sessionStorage.setItem(STORAGE_KEY_PREFIX + fileName, String(scrollTop))
}

/** `null` rather than a default, leaving the one fallback to the schema. */
function readStoredScrollTop(fileName: string): number | null {
	const stored = sessionStorage.getItem(STORAGE_KEY_PREFIX + fileName)

	return stored === null ? null : Number(stored)
}
