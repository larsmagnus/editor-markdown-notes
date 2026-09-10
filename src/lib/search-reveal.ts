import { createOnceReveal } from '#src/lib/once-reveal'
import { searchRevealSchema } from '#src/lib/schemas'
import type { SearchReveal } from '#src/shared/messages'

/**
 * The match this note was opened on, if it was opened from a search result.
 *
 * `window.searchReveal` is injected ahead of the bundle and only then, so its
 * absence is the answer for most opens - there is no default to fall back to,
 * unlike `readScrollTop`. See `once-reveal.ts` for the consume-once contract
 * this and `heading-reveal.ts` share.
 */
function injectedReveal(): SearchReveal | undefined {
	if (!window.searchReveal) return undefined

	const reveal = searchRevealSchema.parse(window.searchReveal)

	// Every field catches to a default rather than throwing, so a payload that
	// degraded to empty text arrives looking valid. This is the one place that
	// can notice there is nothing to look for.
	return reveal.text ? reveal : undefined
}

const reveal = createOnceReveal({
	read: injectedReveal,
	consumedKey: 'searchRevealConsumed',
})

export const hasSearchReveal = reveal.has

/**
 * Every later caller gets `undefined`, which is what keeps a backgrounded tab
 * coming back - or raw mode being toggled an hour later - from yanking the note
 * to a long-forgotten search match.
 */
export const takeSearchReveal = reveal.take
