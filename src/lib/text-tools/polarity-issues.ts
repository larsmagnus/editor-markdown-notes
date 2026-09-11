import type { Root } from 'nlcst'
import { polarity } from 'polarity'

import { polarityTemperature } from '#src/lib/text-tools/polarity-temperature'
import type { PolarityTemperature } from '#src/lib/text-tools/polarity-temperature'
import { textRangesOf } from '#src/lib/text-tools/text-ranges-of'
import type { TextIssue } from '#src/lib/text-tools/types'

/**
 * Emotionally charged words (`words/polarity`'s AFINN-165 + emoji-emotion
 * lexicon), flagged individually, plus the document's overall temperature -
 * `polarity()` scores a whole word list at once rather than word by word, so
 * it's called once here rather than per sentence.
 */
export function polarityIssues(tree: Root): {
	issues: TextIssue[]
	temperature: PolarityTemperature | null
} {
	const words = textRangesOf(tree, 'WordNode')
	if (words.length === 0) return { issues: [], temperature: null }

	const result = polarity(words.map((word) => word.text))
	const positive = new Set(result.positive.map((word) => word.toLowerCase()))
	const negative = new Set(result.negative.map((word) => word.toLowerCase()))

	const issues: TextIssue[] = words.flatMap((word) => {
		const lower = word.text.toLowerCase()
		const direction = positive.has(lower)
			? 'positively'
			: negative.has(lower)
				? 'negatively'
				: null
		if (!direction) return []

		return [
			{
				ruleId: 'polarity' as const,
				severity: 'warning' as const,
				message: `Emotionally charged word (${direction}).`,
				actual: word.text,
				expected: [],
				start: word.start,
				end: word.end,
			},
		]
	})

	const temperature = polarityTemperature(result.polarity / words.length)

	return { issues, temperature }
}
