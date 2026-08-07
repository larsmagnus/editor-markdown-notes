import { describe, expect, it } from 'vitest'

import { summarize } from '@/lib/text-tools/summarize'
import type { Analysis, TextIssue } from '@/lib/text-tools/types'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

const ALL_RULES = [...TEXT_TOOL_RULE_IDS]

function issue(overrides: Partial<TextIssue> = {}): TextIssue {
	return {
		ruleId: 'simplify',
		severity: 'warning',
		message: 'Unexpected `utilize`, use `use` instead',
		actual: 'utilize',
		expected: ['use'],
		start: 0,
		end: 7,
		...overrides,
	}
}

const analysis = (issues: TextIssue[], sentenceCount: number): Analysis => ({
	issues,
	sentenceCount,
})

describe('summarize', () => {
	it('counts the readability sentences against the document total', () => {
		const result = summarize(
			analysis(
				[
					issue({ ruleId: 'readability', severity: 'very-hard' }),
					issue({
						ruleId: 'readability',
						severity: 'hard',
						start: 10,
						end: 20,
					}),
					issue({
						ruleId: 'readability',
						severity: 'hard',
						start: 30,
						end: 40,
					}),
				],
				12
			),
			ALL_RULES
		)

		expect(result.readability.map((line) => line.text)).toEqual([
			'1 of 12 sentences are very hard to read',
			'2 of 12 sentences are hard to read',
		])
	})

	it('says "sentence is" when the document holds only one', () => {
		const result = summarize(
			analysis([issue({ ruleId: 'readability', severity: 'hard' })], 1),
			ALL_RULES
		)

		expect(result.readability[0].text).toBe('1 of 1 sentence is hard to read')
	})

	it('leaves out a readability tier nothing fell into', () => {
		const result = summarize(
			analysis([issue({ ruleId: 'readability', severity: 'hard' })], 5),
			ALL_RULES
		)

		expect(result.readability.map((line) => line.severity)).toEqual(['hard'])
	})

	it('groups the remaining issues under their rule', () => {
		const result = summarize(
			analysis(
				[
					issue({ ruleId: 'passive', actual: 'written' }),
					issue({ ruleId: 'simplify', actual: 'utilize' }),
					issue({ ruleId: 'simplify', actual: 'facilitate' }),
				],
				4
			),
			ALL_RULES
		)

		expect(
			result.groups.map((group) => [group.label, group.issues.length])
		).toEqual([
			['Passive voice', 1],
			['Simpler words', 2],
		])
	})

	it('drops the issues of a rule the user switched off', () => {
		const result = summarize(
			analysis(
				[
					issue({ ruleId: 'passive', actual: 'written' }),
					issue({ ruleId: 'simplify', actual: 'utilize' }),
				],
				4
			),
			['simplify']
		)

		expect(result.groups.map((group) => group.ruleId)).toEqual(['simplify'])
		expect(result.total).toBe(1)
	})

	it('reports nothing for a clean document', () => {
		const result = summarize(analysis([], 6), ALL_RULES)

		expect(result).toMatchObject({ readability: [], groups: [], total: 0 })
	})
})
