import { checkMarkdown } from '@/mcp/tools'
import type { CheckDefaults, CheckOptions } from '@/mcp/tools'

/**
 * A word the speller rejected, with how often it occurs.
 *
 * Frequency is the signal that separates project vocabulary from a typo: a
 * misspelling is usually a one-off, while a product name runs through the whole
 * note. A word with no suggestions at all is the other tell - nothing in the
 * dictionary is close to it.
 */
export type WordCandidate = {
	word: string
	occurrences: number
	suggestions: string[]
	likelyJargon: boolean
}

export async function suggestDictionaryWords(
	markdown: string,
	options: CheckOptions,
	defaults: CheckDefaults
): Promise<WordCandidate[]> {
	const report = await checkMarkdown(
		markdown,
		{ ...options, rules: ['spelling'] },
		defaults
	)

	const counts = new Map<string, WordCandidate>()

	for (const issue of report.issues) {
		const existing = counts.get(issue.actual)
		if (existing) {
			existing.occurrences += 1
			continue
		}

		counts.set(issue.actual, {
			word: issue.actual,
			occurrences: 1,
			suggestions: issue.expected,
			likelyJargon: issue.expected.length === 0,
		})
	}

	return [...counts.values()]
		.map((candidate) => ({
			...candidate,
			likelyJargon: candidate.likelyJargon || candidate.occurrences > 1,
		}))
		.sort((a, b) => b.occurrences - a.occurrences)
}
