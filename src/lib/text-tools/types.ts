import type { SpellingLanguage, TextToolRuleId } from '@/shared/messages'

/**
 * The contract between the main thread and the analysis worker, and between the
 * worker and the decorations/panel that render its output.
 *
 * Everything here crosses `postMessage`, so it must survive structured cloning -
 * plain data only, no class instances and no functions.
 */

/**
 * How a finding is drawn. The two readability tiers tint whole sentences;
 * `misspelling` is its own tier rather than a `warning` because a wrong spelling
 * is an error and the rest are opinions, and the marker should say which.
 */
export type IssueSeverity = 'warning' | 'hard' | 'very-hard' | 'misspelling'

/**
 * A Hunspell dictionary as nspell wants it - strings, not bytes.
 *
 * `aff` defines the affix rules that let one dictionary entry cover a word's
 * whole inflected family; `dic` is the word list itself.
 */
export type HunspellDictionary = { aff: string; dic: string }

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

/**
 * Everything the analysis needs beyond the text itself.
 *
 * An object rather than positional arguments: `dictionary` is sent only on the
 * run that first needs it, which reads as a hole in an argument list.
 */
export type PipelineOptions = {
	rules: TextToolRuleId[]
	targetAge: number
	spellingLanguage: SpellingLanguage
	/**
	 * Present only when the worker does not already hold this language - the
	 * payload is ~575kB, and structured-cloning it on every keystroke would cost
	 * more than the analysis does.
	 */
	dictionary?: HunspellDictionary
	/** Words the spelling check accepts on top of its dictionary. */
	ignoreWords: string[]
}

export type AnalyzeRequest = {
	/** Correlates a response with its request; stale responses are dropped. */
	id: number
	text: string
} & PipelineOptions

/**
 * Failures come back as a message like any other. A worker that just throws
 * leaves its caller's promise pending forever, which shows up as a panel stuck
 * on "Checking…" with nothing logged anywhere.
 */
export type AnalyzeResponse =
	| ({ id: number; ok: true } & Analysis)
	| { id: number; ok: false; error: string }
