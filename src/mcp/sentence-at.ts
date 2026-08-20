import retextEnglish from 'retext-english'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

/**
 * Finds the sentence an issue sits inside.
 *
 * The sentence is what makes a finding actionable: an agent fixes it with its
 * own edit tool, which matches on an exact string and refuses an ambiguous one.
 * The flagged text alone is regularly ambiguous - "was written" may appear a
 * dozen times in a note - while the sentence around it almost never is.
 *
 * Parsed separately from the analysis rather than threaded through it, so
 * `run-pipeline.ts` stays the shared code it is and gains nothing the panel
 * does not use.
 */
export function sentenceFinder(text: string) {
	const ranges: { start: number; end: number }[] = []
	const tree = unified().use(retextEnglish).parse(new VFile(text))

	visit(tree, 'SentenceNode', (node) => {
		const start = node.position?.start.offset
		const end = node.position?.end.offset
		if (start !== undefined && end !== undefined) ranges.push({ start, end })
	})

	return (offset: number): string | undefined => {
		const range = ranges.find(
			(candidate) => candidate.start <= offset && offset < candidate.end
		)

		return range ? text.slice(range.start, range.end).trim() : undefined
	}
}
