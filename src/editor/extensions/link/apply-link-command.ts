import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import { unwrapRun } from '@/editor/extensions/formatting/unwrap-run'
import { wrapRangeWithDelimiter } from '@/editor/extensions/formatting/wrap-selection-with-delimiter'
import { linkCloseText } from '@/editor/extensions/link/link-close-text'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'

export type LinkAttrs = { href: string; title?: string | null }

/** The run the caret/selection sits fully inside, if any. */
function currentRun(
	markType: MarkType,
	doc: Parameters<typeof findMarkRuns>[0],
	from: number,
	to: number
): MarkRun | undefined {
	return findMarkRuns(doc, markType).find(
		(run) => run.from <= from && run.to >= to
	)
}

/**
 * Sets a link's `href`/`title` on the selection - a fresh link over plain
 * text, or new attrs on a link already there. Editing an existing link takes
 * the old one apart and writes the new delimiter text in the same
 * transaction, rather than leaving a bare mark for the repair pass to
 * re-delimit: a stripped delimiter is exactly what an author deleting one
 * leaves behind, and repair answers that by removing the link.
 */
export function createApplyLinkCommand(
	markType: MarkType,
	attrs: LinkAttrs
): Command {
	return (state, dispatch) => {
		const { from, to } = state.selection
		const run = currentRun(markType, state.doc, from, to)
		if (!run && from === to) return false

		if (!dispatch) return true

		const tr = state.tr
		const target = run
			? unwrapRun(tr, markType, linkDelimiterSpec(), run)
			: { from, to }

		wrapRangeWithDelimiter(
			tr,
			markType,
			{ open: '[', close: linkCloseText(attrs.href, attrs.title) },
			target.from,
			target.to,
			attrs
		)
		dispatch(tr)
		return true
	}
}
