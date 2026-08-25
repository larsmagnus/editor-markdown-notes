import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import { edgeResolvers } from '@/editor/extensions/formatting/delimiter-spec'
import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import { inlineCodeFenceText } from '@/editor/extensions/formatting/inline-code/inline-code-fence-text'

/**
 * Delimiter recognition/reconstruction for inline code, for `ensure-
 * delimiters-plugin.ts`. Unlike bold/strike's fixed string, the fence
 * length varies with the code's own content (`inlineCodeFenceText`'s
 * shortest-unused-backtick-run rule), so it can't be reduced to a constant.
 *
 * Detecting each edge independently (a bare leading/trailing backtick run)
 * would misread code content that itself starts or ends with a backtick run
 * - "```mermaid" is legitimate code, not an unfenced run missing only its
 * closing delimiter. A real fence needs *matching* lengths at both ends, so
 * both edges resolve through the same `matchingFenceLength` check and are
 * either both present or both absent - there's no such thing as "half
 * delimited" for a backtick pair the way there is for bold's `**`.
 *
 * The detected length ignores the padding space `inlineCodeFenceText`
 * sometimes adds - a run repaired without that space still needs to read as
 * delimited on the next pass rather than re-triggering a repair (see
 * `ensure-delimiters-plugin.ts`'s nested-mark regression for what happens
 * when detection and reconstruction disagree). The padding only matters for
 * the markdown that gets written out, not for whether a run already "has" a
 * delimiter.
 */
export function inlineCodeDelimiterSpec(): DelimiterSpec {
	return {
		detectOpen: (text) => matchingFenceLength(text),
		detectClose: (text) => matchingFenceLength(text),
		...edgeResolvers(resolveEdge),
	}
}

function matchingFenceLength(text: string): number {
	let open = 0
	while (text[open] === '`') open++

	let close = 0
	while (text[text.length - 1 - close] === '`') close++

	if (open === 0 || open !== close || open + close > text.length) return 0
	return open
}

function resolveEdge(
	doc: ProseMirrorNode,
	run: MarkRun,
	edge: 'open' | 'close'
): string {
	const text = doc.textBetween(run.from, run.to)
	return inlineCodeFenceText(text)[edge]
}
