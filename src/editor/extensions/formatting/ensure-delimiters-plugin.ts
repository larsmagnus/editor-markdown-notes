import type { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { uniformOuterMarks } from '@/editor/extensions/formatting/uniform-outer-marks'
import { anyDocChanged } from '@/editor/extensions/transaction-filters'

/**
 * Extends any run of `markType` missing its delimiter text at either end - the
 * safety net for every way a mark reaches the document without going through
 * `wrap-selection-with-delimiter.ts`. Such a run looks styled in the editor
 * while its near-identity serializer writes it out with no markup at all.
 *
 * The inserted text carries the mark explicitly rather than letting `tr.insert`
 * infer one from the insertion point, plus any outer delimited mark this run
 * nests inside: without those, `**_text_**` oscillates forever, each mark
 * reading the other's fresh delimiter as unmarked and wrapping it again.
 *
 * Runs are fixed in reverse document order, so every not-yet-visited run's
 * positions - all read once, up front - stay valid.
 */
export function createEnsureDelimitersPlugin(
	markType: MarkType,
	spec: DelimiterSpec,
	outerMarkNames: string[] = []
): Plugin {
	return new Plugin({
		key: new PluginKey(`ensureDelimiters$${markType.name}`),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!anyDocChanged(transactions)) return null

			const runs = findMarkRuns(newState.doc, markType)
			let tr: Transaction | undefined

			for (const run of [...runs].reverse()) {
				if (spec.isBare?.(newState.doc, run)) continue

				const runText = newState.doc.textBetween(run.from, run.to)
				if (spec.isMidEdit?.(runText)) continue
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
