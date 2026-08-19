import type { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

import { useAnalysisOptions } from '@/hooks/use-analysis-options'
import { useAnalyzer } from '@/hooks/use-analyzer'
import { useDocumentRevision } from '@/hooks/use-document-revision'
import { getDocumentText } from '@/lib/text-tools/document-text'
import { placeIssues } from '@/lib/text-tools/place-issues'
import type { Analysis } from '@/lib/text-tools/types'
import type { SpellingLanguage, TextToolRuleId } from '@/shared/messages'

const EMPTY_ANALYSIS: Analysis = { issues: [], sentenceCount: 0 }

type UseTextToolsOptions = {
	editor: Editor | null
	enabled: boolean
	rules: TextToolRuleId[]
	targetAge: number
	spellingLanguage: SpellingLanguage
	spellingIgnoreWords: string[]
}

/**
 * Runs the writing checks over the document and pushes the results into both
 * the decoration plugin and the sidebar.
 *
 * The worker and the whole retext stack behind it are only imported once the
 * tools are switched on, and are torn down when they are switched off again.
 */
export function useTextTools({
	editor,
	enabled,
	rules,
	targetAge,
	spellingLanguage,
	spellingIgnoreWords,
}: UseTextToolsOptions) {
	const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const { getAnalyzer, disposeAnalyzer } = useAnalyzer()

	const debouncedRevision = useDocumentRevision(editor)

	const { options, key, hasSpellingFailed } = useAnalysisOptions({
		enabled,
		rules,
		targetAge,
		spellingLanguage,
		spellingIgnoreWords,
	})
	const optionsRef = useRef(options)
	optionsRef.current = options

	// Split from the analysis effect below so it runs on the transition only.
	// Sharing that effect's dependencies would dispatch a no-op transaction
	// every debounce tick while the tools are off, for the whole session.
	useEffect(() => {
		if (enabled || !editor) return

		disposeAnalyzer()
		setAnalysis(EMPTY_ANALYSIS)
		setIsAnalyzing(false)
		editor.commands.setTextToolIssues([])
	}, [editor, enabled, disposeAnalyzer])

	useEffect(() => {
		if (!editor || !enabled) return

		const options = optionsRef.current
		let cancelled = false
		setIsAnalyzing(true)

		const run = async () => {
			const analyzer = await getAnalyzer()
			if (!analyzer || cancelled) return

			const documentText = getDocumentText(editor.state.doc)
			const result = await analyzer.analyze(documentText.text, options)

			// The document may have moved on while the worker was busy. Positions
			// derived from the old snapshot would land in the wrong place, and the
			// debounce already has the next run queued.
			if (cancelled || editor.isDestroyed) return

			setAnalysis(result)
			setIsAnalyzing(false)
			editor.commands.setTextToolIssues(
				placeIssues(result.issues, documentText, new Set(options.rules))
			)
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
	}, [editor, enabled, key, debouncedRevision, getAnalyzer])

	return { analysis, isAnalyzing, hasSpellingFailed }
}
