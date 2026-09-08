import type { MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Selection, Transaction } from '@tiptap/pm/state'

import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'
import { uniformOuterMarks } from '#src/editor/extensions/formatting/uniform-outer-marks'
import { unwrapRun } from '#src/editor/extensions/formatting/unwrap-run'
import { createDeletionProbe } from '#src/editor/extensions/syntax-repair/authored-deletion'
import type { DeletionProbe } from '#src/editor/extensions/syntax-repair/authored-deletion'
import { anyDocChanged } from '#src/editor/extensions/transaction-filters'

/**
 * Where a run whose delimiter the author just deleted now starts. Same
 * distinction the block markers draw (`create-marker-sync-plugin.ts`): a mark
 * that arrived without delimiter text needs some written, but one whose
 * delimiter was deleted needs taking apart, or the style cannot be removed by
 * editing its syntax.
 */
function findAuthoredRemovals(
	oldDoc: ProseMirrorNode,
	markType: MarkType,
	spec: DelimiterSpec,
	probe: DeletionProbe
): Set<number> {
	const removed = new Set<number>()

	for (const run of findMarkRuns(oldDoc, markType)) {
		const text = oldDoc.textBetween(run.from, run.to)
		const openLength = spec.detectOpen(text)
		const closeLength = spec.detectClose(text)

		const gone =
			(openLength > 0 && probe.deleted(run.from, run.from + openLength)) ||
			(closeLength > 0 && probe.deleted(run.to - closeLength, run.to))
		if (gone) removed.add(probe.forward(run.from, -1))
	}

	return removed
}

/**
 * A run holding its two delimiters and nothing else - what a toggle at a bare
 * caret puts down for the author to type into. Valid only while the caret is
 * still in it: `**` with nothing between parses as literal text, so one left
 * behind reaches the file as rubbish.
 */
function isAbandonedEmptyPair(
	doc: ProseMirrorNode,
	spec: DelimiterSpec,
	run: MarkRun,
	selection: Selection
): boolean {
	const text = doc.textBetween(run.from, run.to)
	if (!text || spec.detectOpen(text) + spec.detectClose(text) !== text.length) {
		return false
	}

	return !(selection.from >= run.from && selection.to <= run.to)
}

/** Delimiter text this run is missing, or `null` when it needs none. */
function missingDelimiters(
	doc: ProseMirrorNode,
	spec: DelimiterSpec,
	run: MarkRun
): { open?: string; close?: string } | null {
	if (spec.isBare?.(doc, run)) return null

	const text = doc.textBetween(run.from, run.to)
	if (spec.isMidEdit?.(text)) return null

	const missing = {
		...(spec.detectOpen(text) > 0 ? {} : { open: spec.resolveOpen(doc, run) }),
		...(spec.detectClose(text) > 0
			? {}
			: { close: spec.resolveClose(doc, run) }),
	}

	return 'open' in missing || 'close' in missing ? missing : null
}

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
