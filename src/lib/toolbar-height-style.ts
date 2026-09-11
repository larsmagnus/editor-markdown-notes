import type { CSSProperties } from 'react'

/** The toolbar's own height, matching `toolbar.tsx`'s padding and button size. */
const TOOLBAR_HEIGHT = '3.5rem'

/**
 * The scroll container's `--toolbar-height`, read by a sticky table header's
 * offset in `globals.css` - `0px` once `hideToolbar` removes the toolbar
 * entirely, so the header sticks to the true top instead of leaving a gap.
 */
export function toolbarHeightStyle(hideToolbar: boolean): CSSProperties {
	return {
		'--toolbar-height': hideToolbar ? '0px' : TOOLBAR_HEIGHT,
	} as CSSProperties
}
