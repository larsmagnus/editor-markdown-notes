import { runPipeline } from '#src/lib/text-tools/run-pipeline'
import { summarize } from '#src/lib/text-tools/summarize'
import type { IssueSeverity, TextIssue } from '#src/lib/text-tools/types'
import { loadDictionary } from '#src/mcp/dictionaries'
import { markdownProse } from '#src/mcp/markdown-text'
import { sentenceFinder } from '#src/mcp/sentence-at'
import { summaryLines } from '#src/mcp/summary-lines'
import type { SpellingLanguage, TextToolRuleId } from '#src/shared/messages'

/**
 * The checks themselves, as plain functions over markdown.
 *
 * Kept free of the MCP server's plumbing so they test without a transport, the
 * same separation `run-pipeline.ts` keeps from the analysis worker.
 */

/** What the host's configuration says, for a call that does not override it. */
export type CheckDefaults = {
	rules: TextToolRuleId[]
	targetAge: number
	spellingLanguage: SpellingLanguage
	ignoreWords: string[]
}

type ReportedIssue = {
	rule: TextToolRuleId
	severity: IssueSeverity
	/** 1-based, into the markdown file itself - not into the extracted prose. */
	line: number
	column: number
	/** The flagged text. */
	actual: string
	/** The sentence around it, as an anchor for an exact-match edit. */
	sentence?: string
	expected: string[]
	message: string
}

export type CheckReport = {
	/**
	 * The panel's document-level lines: readability's "n of N sentences are …"
	 * per tier, the polarity rule's overall temperature, and the dash-overuse
	 * rule's document-wide rate - each only when its rule ran and found
	 * something. Per-instance findings for all three still land in `issues`.
	 */
	summary: string[]
	issues: ReportedIssue[]
}

export type CheckOptions = {
	rules?: TextToolRuleId[]
	targetAge?: number
	language?: SpellingLanguage
}

export async function checkMarkdown(
	markdown: string,
	options: CheckOptions,
	defaults: CheckDefaults
): Promise<CheckReport> {
	const rules = options.rules ?? defaults.rules
	const language = options.language ?? defaults.spellingLanguage
	const prose = markdownProse(markdown)

	const analysis = await runPipeline(prose.text, {
		rules,
		targetAge: options.targetAge ?? defaults.targetAge,
		spellingLanguage: language,
		// Loaded only when asked for: reading a ~550kB word list to run the
		// passive-voice check would be the slowest part of the call.
		dictionary: rules.includes('spelling')
			? loadDictionary(language)
			: undefined,
		ignoreWords: defaults.ignoreWords,
	})

	const sentenceOf = sentenceFinder(prose.text)

	return {
		summary: summaryLines(summarize(analysis, rules)),
		issues: analysis.issues.map((issue) => report(issue, prose, sentenceOf)),
	}
}

function report(
	issue: TextIssue,
	prose: ReturnType<typeof markdownProse>,
	sentenceOf: (offset: number) => string | undefined
): ReportedIssue {
	const { line, column } = prose.positionAt(issue.start)

	return {
		rule: issue.ruleId,
		severity: issue.severity,
		line,
		column,
		actual: issue.actual,
		sentence: sentenceOf(issue.start),
		expected: issue.expected,
		message: issue.message,
	}
}
