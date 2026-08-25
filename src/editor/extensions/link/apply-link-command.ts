import type { MarkType } from '@tiptap/pm/model'
import type { Command } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import { stripLinkDelimiters } from '@/editor/extensions/link/strip-link-delimiters'

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
 * text, or new attrs on a link already there. Editing an existing link
 * strips its old delimiter text first (`ensure-delimiters-plugin.ts`
 * synthesizes a fresh one on the very next transaction from whatever attrs
 * end up set here); without that, the previous URL's literal text would sit
 * stale beside the just-updated attrs; the run has valid open/close text
 * already - `ensure-delimiters-plugin.ts` never touches it again.
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
		const target = run ? stripLinkDelimiters(tr, run, markType) : { from, to }

		tr.addMark(target.from, target.to, markType.create(attrs))
		dispatch(tr)
		return true
	}
}
