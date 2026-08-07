import { RULES } from '@/lib/text-tools/rules'
import type { Analysis, TextIssue } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

/** A "n of N sentences are …" line in the panel's header. */
export type ReadabilityLine = {
	severity: 'very-hard' | 'hard'
	count: number
	total: number
	text: string
}

export type RuleGroup = {
	ruleId: TextToolRuleId
	label: string
	issues: TextIssue[]
}

export type Summary = {
	readability: ReadabilityLine[]
	groups: RuleGroup[]
	total: number
}

const READABILITY_LABELS = {
	'very-hard': 'very hard to read',
	hard: 'hard to read',
} as const

/**
 * Shapes an analysis for the panel: the readability sentences as a fraction of
 * the document, and everything else grouped by the rule that found it.
 *
 * Only the enabled rules are grouped, so turning one off empties its section
 * without waiting for the next analysis.
 */
export function summarize(
	analysis: Analysis,
	enabledRules: TextToolRuleId[]
): Summary {
	const enabled = new Set(enabledRules)
	const issues = analysis.issues.filter((issue) => enabled.has(issue.ruleId))

	const readability: ReadabilityLine[] = (['very-hard', 'hard'] as const)
		.map((severity) => {
			const count = issues.filter(
				(issue) => issue.ruleId === 'readability' && issue.severity === severity
			).length

			return {
				severity,
				count,
				total: analysis.sentenceCount,
				text: `${count} of ${analysis.sentenceCount} ${
					analysis.sentenceCount === 1 ? 'sentence is' : 'sentences are'
				} ${READABILITY_LABELS[severity]}`,
			}
		})
		.filter((line) => enabled.has('readability') && line.count > 0)

	const groups: RuleGroup[] = enabledRules
		.map((ruleId) => ({
			ruleId,
			label: RULES[ruleId].label,
			issues: issues.filter((issue) => issue.ruleId === ruleId),
		}))
		.filter((group) => group.issues.length > 0)

	return { readability, groups, total: issues.length }
}
