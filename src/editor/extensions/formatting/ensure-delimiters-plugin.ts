import type { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { uniformOuterMarks } from '@/editor/extensions/formatting/uniform-outer-marks'

/**
 * Extends any run of `markType` missing its delimiter text at either end -
 * a safety net for every way a mark can be applied without going through
 * `wrap-selection-with-delimiter.ts`: HTML paste applying the mark directly,
 * a future `insertContent` call, or any other command that calls `setMark`.
 * Without this, such a run looks fenced in the editor while its markdown
 * serializer (now near-identity, since delimiters are normally real,
 * marked text - see `delimited-mark-extension.ts`) would write it out with
 * no markup at all.
 *
 * The inserted delimiter text carries the mark explicitly, the same as
 * `wrap-selection-with-delimiter.ts` - not left to whatever mark `tr.insert`
 * would otherwise infer from the insertion point, which is exactly the
 * ambiguity a plain `tr.insertText` used to resolve inconsistently at the
 * two ends of a run. `outerMarkNames` (see `uniform-outer-marks.ts`) is what
 * it also carries when this run nests inside another delimited mark - drop
 * that and two nested delimited marks (`**_text_**`) oscillate forever, each
 * one seeing the other's fresh delimiter as *not* carrying it and wrapping
 * it again one layer deeper.
 *
 * Runs are fixed in *reverse* document order: inserting text at a later
 * run's boundary never shifts an earlier run's positions, so each run's
 * `from`/`to` (read once, from `newState.doc`) stays valid through every
 * insertion that follows it in this same pass - fixing forward would
 * invalidate every not-yet-visited run's positions the moment an earlier
 * one's delimiters were inserted.
 */
export function createEnsureDelimitersPlugin(
	markType: MarkType,
	spec: DelimiterSpec,
	outerMarkNames: string[] = []
): Plugin {
	return new Plugin({
		key: new PluginKey(`ensureDelimiters$${markType.name}`),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

			const runs = findMarkRuns(newState.doc, markType)
			let tr: Transaction | undefined

			for (const run of [...runs].reverse()) {
				if (spec.isBare?.(newState.doc, run)) continue

				const runText = newState.doc.textBetween(run.from, run.to)
				const hasOpening = spec.detectOpen(runText) > 0
				const hasClosing = spec.detectClose(runText) > 0
				if (hasOpening && hasClosing) continue

				const marks = [
					run.mark,
					...uniformOuterMarks(newState.doc, run, outerMarkNames),
				]
				const target = tr ?? newState.tr
				if (!hasClosing) {
					target.insert(
						run.to,
						newState.schema.text(spec.resolveClose(newState.doc, run), marks)
					)
				}
				if (!hasOpening) {
					target.insert(
						run.from,
						newState.schema.text(spec.resolveOpen(newState.doc, run), marks)
					)
				}
				tr = target
			}

			return tr
		},
	})
}
