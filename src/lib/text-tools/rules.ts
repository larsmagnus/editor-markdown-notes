import type { IssueSeverity } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * Presentation for each check: what the sidebar calls it and how it explains
 * itself. Main thread only - the worker has its own map from the same ids to
 * the retext plugins that produce the findings.
 */
export type TextToolRule = {
	label: string
	/** One line, short enough for a tooltip. */
	description: string
	/** The concept behind the check, for the info popover. */
	explanation: string
	/**
	 * A rewrite, and the sentence it came from split so the popover can mark it
	 * exactly as the editor marks the same finding - the marker is half of what
	 * the popover is there to explain. `rules.test.ts` runs both halves through
	 * the real pipeline, because an example the check disagrees with teaches the
	 * reader the wrong thing.
	 */
	example: { after: string; before: ExampleSegment[]; severity: IssueSeverity }
}

/** A run of the flawed example, `flagged` where the check would mark it. */
type ExampleSegment = { text: string; flagged?: boolean }

export const RULES: Record<TextToolRuleId, TextToolRule> = {
	passive: {
		label: 'Passive voice',
		description: 'Sentences where the subject receives the action.',
		explanation:
			'The passive voice puts the thing acted on first, and the doer last or nowhere at all. Name the doer first instead. Passive still fits when nobody knows who acted, or when it does not matter.',
		example: {
			after: 'The committee wrote the report.',
			before: [
				{ text: 'The report was ' },
				{ text: 'written', flagged: true },
				{ text: ' by the committee.' },
			],
			severity: 'warning',
		},
	},
	simplify: {
		label: 'Simpler words',
		description: 'Long or formal words with plainer equivalents.',
		explanation:
			'Formal words slow a reader down without adding meaning. Each one flagged here has an everyday twin that says the same thing. Keep the long word when your readers know it as a term of the trade.',
		example: {
			after: 'We use this form to open the process.',
			before: [
				{ text: 'We ' },
				{ text: 'utilise', flagged: true },
				{ text: ' this form to ' },
				{ text: 'commence', flagged: true },
				{ text: ' the process.' },
			],
			severity: 'warning',
		},
	},
	intensify: {
		label: 'Weak words',
		description: 'Filler, hedges and vague intensifiers that add nothing.',
		explanation:
			'Boosters like "very" and hedges like "I think" survive deletion: cut them and the sentence means the same, only more directly. When a hedge carries real doubt, say what the doubt is.',
		example: {
			after: 'This is a significant change.',
			before: [
				{ text: 'This is a ' },
				{ text: 'very', flagged: true },
				{ text: ' significant and ' },
				{ text: 'really', flagged: true },
				{ text: ' ' },
				{ text: 'quite', flagged: true },
				{ text: ' big change.' },
			],
			severity: 'warning',
		},
	},
	readability: {
		label: 'Hard to read',
		description: 'Sentences above the target reading age.',
		explanation:
			'Reading formulas score each sentence on its length and how hard its words are. A sentence lands here when they agree it sits above your target reading age. Splitting it in two usually clears it.',
		example: {
			after:
				'The migration touches every table. Nobody expected it. We moved it to the weekend.',
			// Whole-sentence, because that is the unit readability scores.
			before: [
				{
					text: 'Because the implementation of the aforementioned migration necessitates a comprehensive reconfiguration of every table, an undertaking the team had not anticipated, the deployment was rescheduled to the weekend.',
					flagged: true,
				},
			],
			severity: 'very-hard',
		},
	},
}
