import type { Root } from 'nlcst'
import retextEnglish from 'retext-english'
import retextIntensify from 'retext-intensify'
import retextPassive from 'retext-passive'
import retextReadability from 'retext-readability'
import retextSimplify from 'retext-simplify'
import type { Plugin } from 'unified'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'
import type { VFileMessage } from 'vfile-message'

import type { Analysis, TextIssue } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * The analysis itself, kept free of any worker plumbing so the tests can drive
 * it directly - Vitest cannot start the inline blob worker under happy-dom.
 *
 * This module statically imports the whole retext stack (~43kB gzipped), which
 * is why nothing on the main thread may import it: it is pulled in only by
 * `analyze.worker.ts`, whose source Vite inlines into the lazily-loaded
 * `analyze-client` chunk.
 */

/** The plugin behind each rule. Keyed by `TextToolRuleId`, so a new rule
 * does not compile until it is listed here. */
const RULE_PLUGINS: Record<
	Exclude<TextToolRuleId, 'readability'>,
	Plugin<[], Root>
> = {
	passive: retextPassive,
	simplify: retextSimplify,
	intensify: retextIntensify,
}

/**
 * The `source` each rule's messages arrive under. Declared in this direction so
 * it is keyed by `TextToolRuleId` and a new rule cannot compile without one -
 * the reverse map is derived below. Keyed the other way a missing entry would
 * typecheck and the rule would simply report nothing.
 *
 * Matched on `source` rather than `ruleId` because retext-passive sets `ruleId`
 * to the offending word rather than a category.
 */
const RULE_SOURCES: Record<TextToolRuleId, string> = {
	passive: 'retext-passive',
	simplify: 'retext-simplify',
	intensify: 'retext-intensify',
	readability: 'retext-readability',
}

const SOURCE_TO_RULE = new Map(
	Object.entries(RULE_SOURCES).map(([ruleId, source]) => [
		source,
		ruleId as TextToolRuleId,
	])
)

/**
 * How much older a reader must be for a sentence to count as *very* hard rather
 * than merely hard.
 *
 * Six, not the four Hemingway's grade 10-13 / 14+ split would suggest: the
 * seven algorithms bucket their estimates coarsely, so a four-year gap flags an
 * identical set of sentences and separates nothing. Six clears that resolution -
 * with the default target of 16, "very hard" means still too hard at 22, which
 * is roughly postgraduate reading.
 */
const VERY_HARD_AGE_OFFSET = 6

/**
 * `place` widens to a bare `Point` for messages that mark a spot rather than a
 * range. Every rule here reports a range, but the narrowing keeps that honest.
 */
function offsetsOf(message: VFileMessage) {
	const place = message.place
	if (!place || !('start' in place)) return null

	const { start, end } = place
	if (start.offset === undefined || end.offset === undefined) return null

	return { start: start.offset, end: end.offset }
}

function toIssue(
	message: VFileMessage,
	severity: TextIssue['severity']
): TextIssue | null {
	const ruleId = message.source ? SOURCE_TO_RULE.get(message.source) : undefined
	const offsets = offsetsOf(message)

	// A message without a source we know or without offsets cannot be placed in
	// the document, and a decoration is the whole point.
	if (!ruleId || !offsets) return null

	return {
		ruleId,
		severity,
		message: message.reason,
		actual: message.actual ?? '',
		expected: message.expected ?? [],
		start: offsets.start,
		end: offsets.end,
	}
}

/**
 * `unified` merges the options of a plugin used twice on the same processor, so
 * the two readability tiers cannot share one - they need a processor each. The
 * parse is still done once and the tree handed to both.
 */
async function readabilityMessages(
	tree: Root,
	text: string,
	age: number
): Promise<VFileMessage[]> {
	const file = new VFile(text)
	await unified()
		.use(retextEnglish)
		.use(retextReadability, { age })
		.run(tree, file)

	return file.messages
}

export async function runPipeline(
	text: string,
	rules: TextToolRuleId[],
	targetAge: number
): Promise<Analysis> {
	const enabled = new Set(rules)
	const parser = unified().use(retextEnglish)
	const file = new VFile(text)
	const tree = parser.parse(file)

	let sentenceCount = 0
	visit(tree, 'SentenceNode', () => {
		sentenceCount += 1
	})

	const issues: TextIssue[] = []

	const wordRules = Object.entries(RULE_PLUGINS).filter(([ruleId]) =>
		enabled.has(ruleId as TextToolRuleId)
	)

	if (wordRules.length > 0) {
		const processor = unified().use(retextEnglish)
		for (const [, plugin] of wordRules) processor.use(plugin)

		const ruleFile = new VFile(text)
		await processor.run(tree, ruleFile)

		for (const message of ruleFile.messages) {
			const issue = toIssue(message, 'warning')
			if (issue) issues.push(issue)
		}
	}

	if (enabled.has('readability')) {
		// Anything the stricter pass flags is a subset of the lenient one, so the
		// stricter result is collected first and used to upgrade the severity.
		const veryHard = await readabilityMessages(
			tree,
			text,
			targetAge + VERY_HARD_AGE_OFFSET
		)
		const veryHardStarts = new Set(
			veryHard.map((message) => offsetsOf(message)?.start)
		)

		const hard = await readabilityMessages(tree, text, targetAge)

		for (const message of hard) {
			const severity = veryHardStarts.has(offsetsOf(message)?.start)
				? 'very-hard'
				: 'hard'
			const issue = toIssue(message, severity)
			if (issue) issues.push(issue)
		}
	}

	issues.sort((a, b) => a.start - b.start)

	return { issues, sentenceCount }
}
