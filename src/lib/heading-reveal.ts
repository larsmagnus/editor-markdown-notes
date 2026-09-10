import { createOnceReveal } from '#src/lib/once-reveal'
import { headingRevealSchema } from '#src/lib/schemas'
import type { HeadingReveal } from '#src/shared/messages'

/**
 * The hash this note was opened on, if it was opened as a link's target.
 *
 * `window.headingReveal` is injected ahead of the bundle and only then, so
 * its absence is the answer for most opens - there is no default to fall
 * back to, unlike `readScrollTop`. See `once-reveal.ts` for the consume-once
 * contract this and `search-reveal.ts` share.
 */
function injectedReveal(): HeadingReveal | undefined {
	if (!window.headingReveal) return undefined

	const reveal = headingRevealSchema.parse(window.headingReveal)

	return reveal.hash ? reveal : undefined
}

const reveal = createOnceReveal({
	read: injectedReveal,
	consumedKey: 'headingRevealConsumed',
})

export const hasHeadingReveal = reveal.has

/**
 * Every later caller gets `undefined` - a backgrounded tab coming back must
 * not be yanked to the same target a second time. The *live* `revealHeading`
 * message a later link click posts to an already-open panel is a separate
 * path (`use-heading-reveal.ts`'s own subscription), not gated by this at
 * all: each one is a fresh reveal, not a repeat of this one.
 */
export const takeHeadingReveal = reveal.take
