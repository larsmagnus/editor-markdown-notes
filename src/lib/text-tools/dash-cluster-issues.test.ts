import { describe, expect, it } from 'vitest'

import { dashClusterIssues } from '#src/lib/text-tools/dash-cluster-issues'

function sentence(text: string, dashCount: number, start: number) {
	return { text, dashCount, start, end: start + text.length }
}

describe('dashClusterIssues', () => {
	it('flags a run of five sentences where three carry a dash', () => {
		const sentences = [
			sentence('One—fish.', 1, 0),
			sentence('Two fish.', 0, 10),
			sentence('Red—fish.', 1, 20),
			sentence('Blue fish.', 0, 30),
			sentence('Old—fish.', 1, 41),
		]

		const issues = dashClusterIssues(sentences)

		expect(issues).toHaveLength(1)
		expect(issues[0]).toMatchObject({
			ruleId: 'dashOveruse',
			severity: 'warning',
			message: '3 of these 5 sentences use a dash.',
			start: 0,
			end: 50,
		})
	})

	it('reports nothing when too few sentences carry a dash', () => {
		const sentences = [
			sentence('One—fish.', 1, 0),
			sentence('Two fish.', 0, 10),
			sentence('Red fish.', 0, 20),
			sentence('Blue fish.', 0, 30),
			sentence('Old fish.', 0, 41),
		]

		expect(dashClusterIssues(sentences)).toEqual([])
	})

	it('reports nothing for fewer sentences than the cluster window', () => {
		const sentences = [
			sentence('One—fish.', 1, 0),
			sentence('Two—fish.', 1, 10),
		]

		expect(dashClusterIssues(sentences)).toEqual([])
	})
})
