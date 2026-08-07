import type { TextToolRuleId } from '@/shared/messages'

/**
 * Presentation for each check: what the sidebar calls it and how it explains
 * itself. Main thread only - the worker has its own map from the same ids to
 * the retext plugins that produce the findings.
 */
export type TextToolRule = {
	label: string
	description: string
}

export const RULES: Record<TextToolRuleId, TextToolRule> = {
	passive: {
		label: 'Passive voice',
		description: 'Sentences where the subject receives the action.',
	},
	simplify: {
		label: 'Simpler words',
		description: 'Long or formal words with plainer equivalents.',
	},
	intensify: {
		label: 'Weak words',
		description: 'Filler, hedges and vague intensifiers that add nothing.',
	},
	readability: {
		label: 'Hard to read',
		description: 'Sentences above the target reading age.',
	},
}
