import { readPanelState, updatePanelState } from '@/lib/panel-state'
import { searchRevealSchema } from '@/lib/schemas'
import type { SearchReveal } from '@/shared/messages'

/**
 * The match this note was opened on, if it was opened from a search result.
 *
 * `window.searchReveal` is injected ahead of the bundle and only then, so its
 * absence is the answer for most opens - there is no default to fall back to,
 * unlike `readScrollTop`.
 *
 * The global cannot say whether it has been acted on, and it has to be acted on
 * exactly once: VS Code destroys the webview for a backgrounded tab and rebuilds
 * it from the HTML it already holds, so the same reveal arrives again, looking
 * brand new, every time the reader switches back to the tab. Only the panel's
 * own state survives that, so that is where "already done" is recorded.
 */
function injectedReveal(): SearchReveal | undefined {
	if (!window.searchReveal) return undefined

	const reveal = searchRevealSchema.parse(window.searchReveal)

	// Every field catches to a default rather than throwing, so a payload that
	// degraded to empty text arrives looking valid. This is the one place that
	// can notice there is nothing to look for.
	return reveal.text ? reveal : undefined
}

/**
 * Whether a reveal is still owed, without claiming it.
 *
 * Ask this while rendering, not from an effect: whoever takes the reveal does so
 * in an effect, and a child's effects run before its parent's, so a parent
 * asking later would be told the reveal had already gone.
 */
export function hasSearchReveal(): boolean {
	if (readPanelState().searchRevealConsumed) return false

	return injectedReveal() !== undefined
}

/**
 * The reveal to act on, once and once only.
 *
 * Every later caller gets `undefined`, which is what keeps a backgrounded tab
 * coming back - or raw mode being toggled an hour later - from yanking the note
 * to a long-forgotten search match.
 */
export function takeSearchReveal(): SearchReveal | undefined {
	if (!hasSearchReveal()) return undefined

	updatePanelState({ searchRevealConsumed: true })

	return injectedReveal()
}
