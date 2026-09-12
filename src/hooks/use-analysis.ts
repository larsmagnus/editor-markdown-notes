import { useEffect, useRef, useState } from 'react'

import { useAnalysisOptions } from '#src/hooks/use-analysis-options'
import type { AnalysisRequest } from '#src/hooks/use-analysis-options'
import type { AnalyzerHandle } from '#src/hooks/use-analyzer'
import type { Analysis } from '#src/lib/text-tools/types'

export const EMPTY_ANALYSIS: Analysis = {
	issues: [],
	sentenceCount: 0,
	polarity: null,
	dashOveruse: null,
	overallReadability: null,
}

type FlattenedText = { text: string }

type UseAnalysisOptions<Text extends FlattenedText> = AnalysisRequest &
	AnalyzerHandle & {
		/** The current flattened text to analyze, or `null` while there is none
		 *  (yet) to run against. */
		getFlattenedText: () => Text | null
		/** Changes once editing settles, to debounce how often `getFlattenedText`
		 *  is asked to run again - a revision counter for the editor, or a
		 *  debounced value of the raw draft string. */
		revisionKey: unknown
	}

/**
 * Runs the writing checks over whatever flattened text a caller hands it, and
 * nothing else - no ProseMirror, no dispatching into an editor.
 *
 * Shared by the live editor (`use-text-tools.ts`, flattening the ProseMirror
 * document) and the raw editor (`use-raw-text-tools.ts`, flattening the
 * markdown source string), so the worker round trip and its debounce/dispose
 * lifecycle exist exactly once. Returns `analyzedText` paired with `analysis`
 * so a caller placing issues afterwards maps them through the same text they
 * were found in, not whatever the source has moved on to since.
 *
 * The worker and the whole retext stack behind it are only imported once the
 * tools are switched on, and are torn down when they are switched off again.
 */
export function useAnalysis<Text extends FlattenedText>({
	getFlattenedText,
	revisionKey,
	enabled,
	rules,
	targetAge,
	spellingLanguage,
	spellingIgnoreWords,
	getAnalyzer,
	disposeAnalyzer,
}: UseAnalysisOptions<Text>) {
	const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS)
	const [analyzedText, setAnalyzedText] = useState<Text | null>(null)
	const [isAnalyzing, setIsAnalyzing] = useState(false)

	const { options, key, hasSpellingFailed } = useAnalysisOptions({
		enabled,
		rules,
		targetAge,
		spellingLanguage,
		spellingIgnoreWords,
	})
	const optionsRef = useRef(options)
	optionsRef.current = options

	const getFlattenedTextRef = useRef(getFlattenedText)
	getFlattenedTextRef.current = getFlattenedText

	// Split from the analysis effect below so it runs on the transition only.
	// Sharing that effect's dependencies would dispatch a no-op run every
	// debounce tick while the tools are off, for the whole session.
	useEffect(() => {
		if (enabled) return

		disposeAnalyzer()
		setAnalysis(EMPTY_ANALYSIS)
		setAnalyzedText(null)
		setIsAnalyzing(false)
	}, [enabled, disposeAnalyzer])

	useEffect(() => {
		if (!enabled) return

		const flattened = getFlattenedTextRef.current()
		if (!flattened) return

		const options = optionsRef.current
		let cancelled = false
		setIsAnalyzing(true)

		const run = async () => {
			const analyzer = await getAnalyzer()
			if (!analyzer || cancelled) return

			const result = await analyzer.analyze(flattened.text, options)

			// The text may have moved on while the worker was busy. `analyzedText`
			// would then no longer match `result`, and the debounce already has the
			// next run queued.
			if (cancelled) return

			setAnalysis(result)
			setAnalyzedText(flattened)
			setIsAnalyzing(false)
		}

		run().catch((error) => {
			if (cancelled) return
			// The error object, not `errorMessage(error)` - devtools renders a stack
			// from it, and nothing here needs a string.
			console.error('Text tools analysis failed:', error)
			setIsAnalyzing(false)
		})

		return () => {
			cancelled = true
		}
	}, [enabled, key, revisionKey, getAnalyzer])

	return { analysis, analyzedText, isAnalyzing, hasSpellingFailed }
}
