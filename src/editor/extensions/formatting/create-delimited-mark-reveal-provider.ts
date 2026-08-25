import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import type { RevealProvider } from '@/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals a fixed-length delimited mark's delimiter text (`**bold**`,
 * `~~strike~~`) only while the caret touches the run they wrap - the
 * delimiters are the first/last `delimiterLength` characters of the mark's
 * own run (see `wrap-selection-with-delimiter.ts` - marked along with the
 * text they wrap, not adjacent plain text), so this reasons entirely from
 * mark boundaries (`findMarkRuns`), never text content.
 */
export function createDelimitedMarkRevealProvider(
	markTypeName: string,
	delimiterLength: number
): RevealProvider {
	return {
		collect(doc) {
			const markType = doc.type.schema.marks[markTypeName]
			if (!markType) return []

			return findMarkRuns(doc, markType)
				.filter((run) => run.to - run.from >= delimiterLength * 2)
				.map((run) => ({
					containerFrom: run.from,
					containerTo: run.to,
					syntaxRanges: [
						[run.from, run.from + delimiterLength],
						[run.to - delimiterLength, run.to],
					],
				}))
		},
	}
}
