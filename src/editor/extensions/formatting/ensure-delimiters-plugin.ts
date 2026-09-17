import type { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import {
	findAuthoredRemovals,
	isAbandonedEmptyPair,
	missingDelimiters,
} from '#src/editor/extensions/formatting/ensure-delimiters-classify'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import { uniformOuterMarks } from '#src/editor/extensions/formatting/uniform-outer-marks'
import { unwrapRun } from '#src/editor/extensions/formatting/unwrap-run'
import { createDeletionProbe } from '#src/editor/extensions/syntax-repair/authored-deletion'
import { anyDocChanged } from '#src/editor/extensions/transaction-filters'

/**
 * Extends any run of `markType` missing its delimiter text at either end - the
 * safety net for every way a mark reaches the document without going through
 * `wrap-selection-with-delimiter.ts`. Such a run looks styled in the editor
 * while its near-identity serializer writes it out with no markup at all.
 *
 * A run whose delimiter the author deleted is unwrapped instead, both ends and
 * the mark going together. Reinstating it there is what makes bold text
 * impossible to unbold by backspacing at its own `**`.
 *
 * The reverse case is an empty pair the caret has moved away from, which is
 * swept the moment that happens - see `isAbandonedEmptyPair`.
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
		appendTransaction: (transactions, oldState, newState) => {
			const docChanged = anyDocChanged(transactions)
			// Selection changes count too, and only for the empty-pair sweep: the
			// caret leaving one is the event that makes it rubbish, and no document
			// change need accompany it.
			if (!docChanged && oldState.selection.eq(newState.selection)) return null

			const removed = findAuthoredRemovals(
				oldState.doc,
				markType,
				spec,
				createDeletionProbe(transactions)
			)
			const runs = findMarkRuns(newState.doc, markType)
			let tr: Transaction | undefined

			for (const run of [...runs].reverse()) {
				if (isAbandonedEmptyPair(newState.doc, spec, run, newState.selection)) {
					tr = tr ?? newState.tr
					tr.delete(run.from, run.to)
					continue
				}
				if (!docChanged) continue

				// Asked before the removal check, so a run whose delimiter was
				// rewritten rather than dropped - `apply-link-command.ts` replacing a
				// URL - is left alone by both branches.
				const missing = missingDelimiters(newState.doc, spec, run)
				if (!missing) continue

				if (removed.has(run.from)) {
					tr = tr ?? newState.tr
					unwrapRun(tr, markType, spec, run)
					continue
				}

				const marks = [
					run.mark,
					...uniformOuterMarks(newState.doc, run, outerMarkNames),
				]
				const target = tr ?? newState.tr
				if (missing.close !== undefined) {
					target.insert(run.to, newState.schema.text(missing.close, marks))
				}
				if (missing.open !== undefined) {
					target.insert(run.from, newState.schema.text(missing.open, marks))
				}
				tr = target
			}

			return tr
		},
	})
}
