import type { Root } from 'nlcst'
import retextEnglish from 'retext-english'
import retextReadability from 'retext-readability'
import { unified } from 'unified'
import { VFile } from 'vfile'
import type { VFileMessage } from 'vfile-message'

import type { TextIssue } from '@/lib/text-tools/types'
import { offsetsOf, toIssue } from '@/lib/text-tools/vfile-message-to-issue'

/**
 * How much older a reader must be for a sentence to count as *very* hard rather
 * than merely hard.
 *
 * Six, not the four Hemingway's grade 10-13 / 14+ split would suggest: the
 * seven algorithms bucket their estimates coarsely, so a four-year gap flags an
 * identical set of sentences and separates nothing. Six clears that resolution -
 * with the default target of 16, "very hard" means still too hard at 22, which
 * is roughly postgraduate reading.
 */
const VERY_HARD_AGE_OFFSET = 6

/**
 * `unified` merges the options of a plugin used twice on the same processor, so
 * the two readability tiers cannot share one - they need a processor each. The
 * parse is still done once and the tree handed to both.
 */
async function readabilityMessages(
	tree: Root,
	text: string,
	age: number
): Promise<VFileMessage[]> {
	const file = new VFile(text)
	await unified()
		.use(retextEnglish)
		.use(retextReadability, { age })
		.run(tree, file)

	return file.messages
}

/** Sentences too hard for the target reader, in two severity tiers. */
export async function readabilityIssues(
	tree: Root,
	text: string,
	targetAge: number
): Promise<TextIssue[]> {
	// Anything the stricter pass flags is a subset of the lenient one, so the
	// stricter result is collected first and used to upgrade the severity.
	const veryHard = await readabilityMessages(
		tree,
		text,
		targetAge + VERY_HARD_AGE_OFFSET
	)
	const veryHardStarts = new Set(
		veryHard.map((message) => offsetsOf(message)?.start)
	)

	const hard = await readabilityMessages(tree, text, targetAge)

	return hard.flatMap((message) => {
		const severity = veryHardStarts.has(offsetsOf(message)?.start)
			? 'very-hard'
			: 'hard'
		const issue = toIssue(message, severity)

		return issue ? [issue] : []
	})
}
