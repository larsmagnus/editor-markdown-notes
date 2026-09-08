import type { DelimiterSpec } from '#src/editor/extensions/formatting/delimiter-spec'
import { findMarkRuns } from '#src/editor/extensions/formatting/find-mark-runs'
import type { RevealProvider } from '#src/editor/extensions/syntax-reveal/reveal-provider'

/**
 * Reveals a delimited mark's delimiter text (`**bold**`, `` `code` ``) only
 * while the caret touches the run they wrap - the delimiters are the first/
 * last characters of the mark's own run (see `wrap-selection-with-
 * delimiter.ts` - marked along with the text they wrap, not adjacent plain
 * text), so this reasons entirely from mark boundaries (`findMarkRuns`) and
 * `spec`'s own detection, not a fixed length - inline code's fence varies
 * run to run, unlike bold/strike/italic's constant-length delimiters.
 */
export function createDelimitedMarkRevealProvider(
	markTypeName: string,
	spec: DelimiterSpec
): RevealProvider {
	return {
		collect(doc) {
			const markType = doc.type.schema.marks[markTypeName]
			if (!markType) return []

			return findMarkRuns(doc, markType).flatMap((run) => {
				const runText = doc.textBetween(run.from, run.to)
				const openLength = spec.detectOpen(runText)
				const closeLength = spec.detectClose(runText)
				if (openLength === 0 || closeLength === 0) return []
				if (openLength + closeLength > runText.length) return []

				return [
					{
						containerFrom: run.from,
						containerTo: run.to,
						syntaxRanges: [
							[run.from, run.from + openLength],
							[run.to - closeLength, run.to],
						] as [number, number][],
					},
				]
			})
		},
	}
}
