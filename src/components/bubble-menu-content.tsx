'use client'

import { TextBubbleControls } from '#src/components/text-bubble-controls'

/**
 * The bubble menu's content, separate from the bubble that positions it.
 * `BubbleMenu` measures the DOM through floating-ui, which happy-dom cannot
 * do, so this split is what makes the controls testable at all. An image's
 * `NodeSelection` never reaches here - `MenuBubble`'s `shouldShow` excludes
 * it, since an image's controls are an overlay in its own node view
 * (`image/toolbar.tsx`), not this menu.
 */
export function BubbleMenuContent() {
	return <TextBubbleControls />
}
