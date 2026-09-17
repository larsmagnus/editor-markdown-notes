import type { MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Selection } from '@tiptap/pm/state'

import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'
import type { DeletionProbe } from '#src/editor/extensions/syntax-repair/authored-deletion'

/**
 * Where a run whose delimiter the author just deleted now starts. Same
 * distinction the block markers draw (`create-marker-sync-plugin.ts`): a mark
 * that arrived without delimiter text needs some written, but one whose
 * delimiter was deleted needs taking apart, or the style cannot be removed by
 * editing its syntax.
 */
export function findAuthoredRemovals(
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
export function isAbandonedEmptyPair(
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
export function missingDelimiters(
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
