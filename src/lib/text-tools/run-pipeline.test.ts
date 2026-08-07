import { describe, expect, it } from 'vitest'

import { runPipeline } from '@/lib/text-tools/run-pipeline'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

const ALL_RULES = [...TEXT_TOOL_RULE_IDS]

/** The default the `editorMarkdownNotes.textToolsTargetAge` setting ships with. */
const TARGET_AGE = 16

describe('runPipeline', () => {
	it('flags the passive voice', async () => {
		const text = 'The report was written by the committee.'

		const { issues } = await runPipeline(text, ['passive'], TARGET_AGE)

		expect(issues).toHaveLength(1)
		expect(issues[0]).toMatchObject({
			ruleId: 'passive',
			severity: 'warning',
			actual: 'written',
		})
		expect(text.slice(issues[0].start, issues[0].end)).toBe('written')
	})

	it('suggests a simpler word, and offers the alternatives', async () => {
		const text = 'We utilize several tools.'

		const { issues } = await runPipeline(text, ['simplify'], TARGET_AGE)

		expect(issues).toHaveLength(1)
		expect(issues[0]).toMatchObject({
			ruleId: 'simplify',
			actual: 'utilize',
			expected: ['use'],
		})
	})

	it('flags filler and weasel words', async () => {
		const text = 'This is obviously a very good idea.'

		const { issues } = await runPipeline(text, ['intensify'], TARGET_AGE)

		expect(issues.map((issue) => issue.actual)).toEqual(
			expect.arrayContaining(['obviously', 'very'])
		)
		expect(issues.every((issue) => issue.ruleId === 'intensify')).toBe(true)
	})

	it('flags a hard-to-read sentence against the target age', async () => {
		const text =
			'We utilize a plethora of methodologies in order to facilitate the aforementioned initiative, which is clearly a very significant undertaking.'

		const { issues } = await runPipeline(text, ['readability'], TARGET_AGE)

		expect(issues).toHaveLength(1)
		expect(issues[0].ruleId).toBe('readability')
		expect(issues[0].severity).toBe('hard')
		// The decoration should cover the whole sentence.
		expect(text.slice(issues[0].start, issues[0].end)).toBe(text)
	})

	it('reserves "very hard" for the sentence still too hard for a much older reader', async () => {
		const hard =
			'The committee reviewed the proposal and decided that the project should continue for another year despite the budget concerns raised earlier.'
		const veryHard =
			'It is simply obvious that the aforementioned assertion, notwithstanding its apparent perspicuity, remains fundamentally incommensurable with the empirical substrate upon which the discipline purports to rest and therefore cannot be reconciled.'

		const { issues } = await runPipeline(
			`${hard}\n\n${veryHard}`,
			['readability'],
			TARGET_AGE
		)

		expect(issues).toHaveLength(2)
		expect(issues[0]).toMatchObject({ severity: 'hard', actual: hard })
		expect(issues[1]).toMatchObject({ severity: 'very-hard', actual: veryHard })
	})

	it('counts every sentence, so the panel has a denominator', async () => {
		const text = 'One fish. Two fish.\n\nRed fish. Blue fish.'

		const { sentenceCount } = await runPipeline(text, ALL_RULES, TARGET_AGE)

		expect(sentenceCount).toBe(4)
	})

	it('runs only the rules it is given', async () => {
		const text =
			'The report was written by the committee, which will utilize it.'

		const { issues } = await runPipeline(text, ['simplify'], TARGET_AGE)

		expect(issues.map((issue) => issue.ruleId)).toEqual(['simplify'])
	})

	it('reports nothing when every rule is off', async () => {
		const text = 'The report was written by the committee.'

		const { issues, sentenceCount } = await runPipeline(text, [], TARGET_AGE)

		expect(issues).toEqual([])
		expect(sentenceCount).toBe(1)
	})

	it('returns issues in document order', async () => {
		const text =
			'It is simply obvious that the report was written by the committee, which will utilize a plethora of methodologies to facilitate it.'

		const { issues } = await runPipeline(text, ALL_RULES, TARGET_AGE)

		const starts = issues.map((issue) => issue.start)
		expect(starts).toEqual([...starts].sort((a, b) => a - b))
	})
})
