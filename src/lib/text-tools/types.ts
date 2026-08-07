import type { TextToolRuleId } from '@/shared/messages'

/**
 * The contract between the main thread and the analysis worker, and between the
 * worker and the decorations/panel that render its output.
 *
 * Everything here crosses `postMessage`, so it must survive structured cloning -
 * plain data only, no class instances and no functions.
 */

/** How badly a sentence reads, for the two readability tiers. */
export type IssueSeverity = 'warning' | 'hard' | 'very-hard'

export type TextIssue = {
	ruleId: TextToolRuleId
	severity: IssueSeverity
	/** retext's own wording, e.g. "Unexpected use of the passive voice". */
	message: string
	/** The flagged text itself. */
	actual: string
	/** Suggested replacements, if the rule offers any. */
	expected: string[]
	/**
	 * Offsets into the plain text handed to the worker - *not* ProseMirror
	 * positions. `offsetToPosition` in `./document-text.ts` converts them.
	 */
	start: number
	end: number
}

export type Analysis = {
	issues: TextIssue[]
	/** Denominator for the panel's "n of N sentences" summary. */
	sentenceCount: number
}

export type AnalyzeRequest = {
	/** Correlates a response with its request; stale responses are dropped. */
	id: number
	text: string
	rules: TextToolRuleId[]
	targetAge: number
}

/**
 * Failures come back as a message like any other. A worker that just throws
 * leaves its caller's promise pending forever, which shows up as a panel stuck
 * on "Checking…" with nothing logged anywhere.
 */
export type AnalyzeResponse =
	| ({ id: number; ok: true } & Analysis)
	| { id: number; ok: false; error: string }
