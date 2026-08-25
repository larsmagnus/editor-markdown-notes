import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import { italicMarkup } from '@/editor/extensions/italic/italic-markup'

/**
 * Delimiter recognition/reconstruction for italic, for `ensure-delimiters-
 * plugin.ts`. Unlike bold/strike's fixed string, the correct character
 * (`_` vs `*`) depends on the run's own context (`italicMarkup`'s CommonMark
 * intraword rule), so both edges are recomputed from the run's position in
 * the document rather than returning a constant.
 */
export function italicDelimiterSpec(): DelimiterSpec {
	return {
		length: 1,
		matches: (candidate) => candidate === '*' || candidate === '_',
		resolveOpen: (doc, run) => resolveEdge(doc, run, 'open'),
		resolveClose: (doc, run) => resolveEdge(doc, run, 'close'),
	}
}

function resolveEdge(
	doc: ProseMirrorNode,
	run: MarkRun,
	edge: 'open' | 'close'
): string {
	const $pos = doc.resolve(edge === 'open' ? run.from : run.to)
	return italicMarkup(run.mark, $pos.parent, $pos.index(), edge)
}
