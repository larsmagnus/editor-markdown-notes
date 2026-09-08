import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import { edgeResolvers } from '#src/editor/extensions/formatting/delimiter-spec'
import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'
import { inlineCodeFenceText } from '#src/editor/extensions/formatting/inline-code/inline-code-fence-text'

/**
 * Delimiter recognition for inline code, whose fence length varies with the
 * code's own content and so cannot be a constant.
 *
 * Both edges resolve through one `matchingFenceLength` check, never
 * independently: code content may itself start or end with a backtick run -
 * "```mermaid" is legitimate code, not a run missing its close - so a real
 * fence needs matching lengths at both ends. There is no "half delimited"
 * backtick pair the way there is for bold's `**`.
 *
 * Detection ignores the padding space `inlineCodeFenceText` sometimes adds:
 * that matters for the markdown written out, not for whether a run already
 * has a delimiter, and a disagreement between the two re-triggers repair.
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

	if (open === 0) return 0

	// Backticks the whole way through, so the two runs are the same characters
	// counted twice. An even number of them is the empty pair a toggle at a bare
	// caret puts down; an odd number splits into no pair at all.
	if (open + close > text.length) {
		return text.length % 2 === 0 ? text.length / 2 : 0
	}

	return open === close ? open : 0
}

function resolveEdge(
	doc: ProseMirrorNode,
	run: MarkRun,
	edge: 'open' | 'close'
): string {
	const text = doc.textBetween(run.from, run.to)
	return inlineCodeFenceText(text)[edge]
}
