import type { MouseEvent } from 'react'

import { LIVE_EDITOR_ID } from '#src/editor/editor-mode-live-surface'
import { RAW_MARKDOWN_EDITOR_ID } from '#src/editor/editor-mode-raw'

/**
 * Where the "Skip to editor" link jumps to.
 *
 * A module-scoped singleton rather than React context: the skip link and
 * the live `Editor` instance share no common ancestor, and the app never
 * mounts more than one live editor at a time. Set by
 * `use-focus-navigation.ts` on mount, cleared on unmount.
 */
export const skipToEditorRef: { current: (() => void) | null } = {
	current: null,
}

/** Uses the live editor's target if mounted, else falls back to the raw
 *  markdown textarea (raw mode never publishes `skipToEditorRef`). */
export function skipToEditor(): void {
	if (skipToEditorRef.current) {
		skipToEditorRef.current()
		return
	}

	document.getElementById(RAW_MARKDOWN_EDITOR_ID)?.focus()
}

/** The skip link's `href` target, matching whichever id `skipToEditor`
 *  actually reaches. */
export function skipTargetId(raw: boolean): string {
	return raw ? RAW_MARKDOWN_EDITOR_ID : LIVE_EDITOR_ID
}

/** A skip link's `onClick`: run `action` instead of the browser's own
 *  fragment jump. */
export function asSkipLinkClick(action: () => void) {
	return (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault()
		action()
	}
}
