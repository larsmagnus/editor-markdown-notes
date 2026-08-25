import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { stripLinkDelimiters } from '@/editor/extensions/link/strip-link-delimiters'

/**
 * Removes a link, delimiter text included - a text run's `[`/`](href
 * "title")` sit inside the mark's own run (see `link-delimiter-spec.ts`) and
 * must go with it, or unlinking would leave plain paragraph text reading
 * `[the notes](https://example.com)`. Falls back to a bare `removeMark` over
 * the selection when no run matches - an image wrapped in a link has no text
 * run at all (see `link-markdown-spec.ts`), so there is no delimiter text to
 * strip, only the mark itself.
 */
export function createUnlinkCommand(markType: MarkType): Command {
	return (state, dispatch) => {
		const { from, to } = state.selection
		const run = findMarkRuns(state.doc, markType).find(
			(candidate) => candidate.from <= from && candidate.to >= to
		)

		if (!dispatch) return true

		const tr = state.tr
		if (run) stripLinkDelimiters(tr, run, markType)
		else tr.removeMark(from, to, markType)
		dispatch(tr)
		return true
	}
}
