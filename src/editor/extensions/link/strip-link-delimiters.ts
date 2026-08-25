import type { MarkType } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'

/**
 * Strips a link run's mark and its own `[`/`](href "title")` delimiter text
 * from `tr`, returning the bare text range left behind - shared by
 * `apply-link-command.ts` (about to reapply the mark with new attrs over
 * that range) and `unlink-command.ts` (removing the link outright). Deletes
 * the closing delimiter before the opening one: deleting later text never
 * shifts the still-unused `run.from`.
 */
export function stripLinkDelimiters(
	tr: Transaction,
	run: MarkRun,
	markType: MarkType
): { from: number; to: number } {
	const spec = linkDelimiterSpec()
	const runText = tr.doc.textBetween(run.from, run.to)
	const openLength = spec.detectOpen(runText)
	const closeLength = spec.detectClose(runText)

	tr.removeMark(run.from, run.to, markType)
	if (closeLength > 0) tr.delete(run.to - closeLength, run.to)
	if (openLength > 0) tr.delete(run.from, run.from + openLength)

	return {
		from: run.from,
		to: run.from + (run.to - run.from - openLength - closeLength),
	}
}
