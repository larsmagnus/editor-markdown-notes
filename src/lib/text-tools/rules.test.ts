import dictionaryEn from 'dictionary-en'
import { describe, expect, it } from 'vitest'

import { RULES } from '#src/lib/text-tools/rules'
import { runPipeline } from '#src/lib/text-tools/run-pipeline'
import type { PipelineOptions } from '#src/lib/text-tools/types'
import { TEXT_TOOL_RULE_IDS } from '#src/shared/messages'

/**
 * `polarity` and `dashOveruse` are excluded from the shared cross-check loop:
 * both are prone to firing on ordinary prose (a rewritten example just needs
 * one positive word, or two dashes anywhere, to trip them), so every other
 * rule's "cleared" example would need to dodge them by luck. They get their
 * own tests below instead, each with only itself enabled.
 */
const CROSS_CHECKED_RULES = TEXT_TOOL_RULE_IDS.filter(
	(id) => id !== 'polarity' && id !== 'dashOveruse'
)

/** The default the `editorMarkdownNotes.textToolsTargetAge` setting ships with. */
const TARGET_AGE = 16

const decoder = new TextDecoder()

/**
 * The real American dictionary, read straight from the package - under Node it
 * loads itself off disk, where the browser build hands the worker `?raw` text.
 * Decoded to strings because that is what nspell can actually parse.
 */
const DICTIONARY = {
	aff: decoder.decode(dictionaryEn.aff),
	dic: decoder.decode(dictionaryEn.dic),
}

/** Everything `runPipeline` needs beyond the rules under test. */
const BASE_OPTIONS: Omit<PipelineOptions, 'rules'> = {
	targetAge: TARGET_AGE,
	spellingLanguage: 'en-US',
	dictionary: DICTIONARY,
	ignoreWords: [],
}

/**
 * The info popover marks its "instead of" example with the same decorations the
 * editor draws, so an example the check disagrees with teaches the reader that
 * the wrong words are the problem - or that a marker means something it does
 * not. Both halves are held against the real pipeline, one test per rule.
 */
describe('rule examples', () => {
	it.each(CROSS_CHECKED_RULES)(
		'%s flags exactly what its example marks',
		async (id) => {
			const { example } = RULES[id]
			const before = example.before.map((segment) => segment.text).join('')

			const { issues } = await runPipeline(before, {
				rules: CROSS_CHECKED_RULES,
				...BASE_OPTIONS,
			})
			const found = issues.filter((issue) => issue.ruleId === id)

			expect(found.map((issue) => issue.actual)).toEqual(
				example.before.filter((segment) => segment.flagged).map((s) => s.text)
			)
			expect(found.every((issue) => issue.severity === example.severity)).toBe(
				true
			)
		}
	)

	it.each(CROSS_CHECKED_RULES)(
		'%s clears every check once rewritten',
		async (id) => {
			const { issues } = await runPipeline(RULES[id].example.after, {
				rules: CROSS_CHECKED_RULES,
				...BASE_OPTIONS,
			})

			expect(issues).toEqual([])
		}
	)

	it.each(['polarity', 'dashOveruse'] as const)(
		'%s flags exactly what its example marks',
		async (id) => {
			const { example } = RULES[id]
			const before = example.before.map((segment) => segment.text).join('')

			const { issues } = await runPipeline(before, {
				rules: [id],
				...BASE_OPTIONS,
			})

			expect(issues.map((issue) => issue.actual)).toEqual(
				example.before.filter((segment) => segment.flagged).map((s) => s.text)
			)
			expect(issues.every((issue) => issue.severity === example.severity)).toBe(
				true
			)
		}
	)

	it.each(['polarity', 'dashOveruse'] as const)(
		'%s clears once rewritten',
		async (id) => {
			const { issues } = await runPipeline(RULES[id].example.after, {
				rules: [id],
				...BASE_OPTIONS,
			})

			expect(issues).toEqual([])
		}
	)
})
