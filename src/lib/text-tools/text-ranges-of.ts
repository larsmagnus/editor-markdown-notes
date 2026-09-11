import type { Root } from 'nlcst'
import { toString } from 'nlcst-to-string'
import { visit } from 'unist-util-visit'

export type TextRange = { text: string; start: number; end: number }

/**
 * Every node of `type` in `tree`, as its own text and offset range - the walk
 * `polarity-issues.ts` (`WordNode`) and `dash-overuse-issues.ts`
 * (`SentenceNode`) both need before they can do anything rule-specific with
 * what they find.
 */
export function textRangesOf(tree: Root, type: string): TextRange[] {
	const ranges: TextRange[] = []

	visit(tree, type, (node) => {
		const { position } = node
		if (!position) return

		ranges.push({
			text: toString(node),
			start: position.start.offset ?? 0,
			end: position.end.offset ?? 0,
		})
	})

	return ranges
}
