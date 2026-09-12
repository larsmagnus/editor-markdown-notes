import type { IssueSeverity } from '#src/lib/text-tools/types'
import type { TextToolRuleId } from '#src/shared/messages'

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
	 *
	 * Omitted for a rule with no single flagged span to show, such as
	 * `OVERALL_READABILITY_RULE` - a document-level score, not a per-sentence
	 * marker.
	 */
	example?: {
		after: string
		before: ExampleSegment[]
		severity: IssueSeverity
	}
}

/** A run of the flawed example, `flagged` where the check would mark it. */
type ExampleSegment = { text: string; flagged?: boolean }

/**
 * Text tool rules.
 *
 * @note Style guide for `label`, `description`, and `explanation`:
 * - Write at roughly a grade 3-5 reading level: short sentences, plain words.
 * - Name the concrete thing a term stands for instead of a vague label
 *   - e.g instead of "to do a comma's job", say "to join or separate ideas".
 * - No hyphens, em dashes, or semicolons in the text itself. Split into two
 *   sentences instead.
 * - `description` is one line for a tooltip. `explanation` is a few short
 *   sentences: what the check looks for, when it's fine, and what to do.
 */
export const RULES: Record<
	TextToolRuleId,
	TextToolRule & { example: NonNullable<TextToolRule['example']> }
> = {
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
	spelling: {
		label: 'Spelling',
		description: 'Words your dictionary does not recognise.',
		explanation:
			'Every word here is missing from the dictionary you picked; the suggestions are its nearest entries. Names and jargon land here too - it has no way to know them. If the flags are all British spellings, switch the language.',
		example: {
			after: 'We received the report and filed it separately.',
			before: [
				{ text: 'We ' },
				{ text: 'recieved', flagged: true },
				{ text: ' the report and filed it ' },
				{ text: 'seperately', flagged: true },
				{ text: '.' },
			],
			severity: 'misspelling',
		},
	},
	repeatedWords: {
		label: 'Repeated words',
		description: 'The same word typed twice in a row.',
		explanation:
			'A word slips in twice when a sentence gets rewritten mid-thought. Remove one occurrence. A short list of words that legitimately double up - "had had", "that that" - is already let through.',
		example: {
			after: 'This is a good idea.',
			before: [
				{ text: 'This ' },
				{ text: 'is is', flagged: true },
				{ text: ' a good idea.' },
			],
			severity: 'warning',
		},
	},
	polarity: {
		label: 'Sentiment',
		description: 'Words with positive or negative emotional affect.',
		explanation:
			"Emotionally charged words influence a reader's reaction before the argument does. Each word is listed, along with the document's overall temperature. Emotionally charged language is not automatically wrong, it just deserves to be a choice.",
		example: {
			after: 'This is a change we should discuss.',
			before: [
				{ text: 'This is a ' },
				{ text: 'wonderful', flagged: true },
				{ text: ' change, but also somewhat ' },
				{ text: 'terrible', flagged: true },
				{ text: ' for the schedule.' },
			],
			severity: 'warning',
		},
	},
	readability: {
		label: 'Readability',
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
	dashOveruse: {
		label: 'Dash overuse',
		description: 'Sentences using em or en dashes to join or separate ideas.',
		explanation:
			'A dash can replace a comma or a period. Using one now and then is fine. Using many in one sentence, or one in almost every sentence, makes the writing feel restless. The panel also counts how often dashes show up across the whole document. Try a comma, a period, or parentheses instead.',
		example: {
			after: 'The report was late. The client noticed immediately.',
			before: [
				{
					text: 'The report was late—again—and the client noticed—immediately.',
					flagged: true,
				},
			],
			severity: 'warning',
		},
	},
}

/**
 * Content for the overall readability verdict's info popover
 * (`overall-readability.ts`). Not part of `RULES`: it is not a `TextToolRuleId`,
 * only a document-level score gated on the `readability` rule, so it has no
 * single flagged span to build an `example` from.
 */
export const OVERALL_READABILITY_RULE: TextToolRule = {
	label: 'Overall readability',
	description:
		'How easy the whole document is to read, based on word and sentence length.',
	explanation:
		'This score comes from a formula called the Automated Readability Index. It looks at the average length of your words and sentences, not what they mean. The formula gives a grade from about 1 to 14, then five years are added to show an age instead. Most adults read best at a level far below their own reading skill, often around grade 7 or 8. A low score means the writing is clear, not childish. Mixing short and long sentences reads better than keeping every sentence the same length.',
}
