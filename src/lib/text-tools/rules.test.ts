import { describe, expect, it } from 'vitest'

import { RULES } from '@/lib/text-tools/rules'
import { runPipeline } from '@/lib/text-tools/run-pipeline'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

const ALL_RULES = [...TEXT_TOOL_RULE_IDS]

/** The default the `editorMarkdownNotes.textToolsTargetAge` setting ships with. */
const TARGET_AGE = 16

/**
 * The info popover marks its "instead of" example with the same decorations the
 * editor draws, so an example the check disagrees with teaches the reader that
 * the wrong words are the problem - or that a marker means something it does
 * not. Both halves are held against the real pipeline, one test per rule.
 */
describe('rule examples', () => {
	it.each(ALL_RULES)('%s flags exactly what its example marks', async (id) => {
		const { example } = RULES[id]
		const before = example.before.map((segment) => segment.text).join('')

		const { issues } = await runPipeline(before, ALL_RULES, TARGET_AGE)
		const found = issues.filter((issue) => issue.ruleId === id)

		expect(found.map((issue) => issue.actual)).toEqual(
			example.before.filter((segment) => segment.flagged).map((s) => s.text)
		)
		expect(found.every((issue) => issue.severity === example.severity)).toBe(
			true
		)
	})

	it.each(ALL_RULES)('%s clears every check once rewritten', async (id) => {
		const { issues } = await runPipeline(
			RULES[id].example.after,
			ALL_RULES,
			TARGET_AGE
		)

		expect(issues).toEqual([])
	})
})
