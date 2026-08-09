import type { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

import { useDocumentRevision } from '@/hooks/use-document-revision'
import type { Analyzer } from '@/lib/text-tools/analyze-client'
import { getDocumentText } from '@/lib/text-tools/document-text'
import { placeIssues } from '@/lib/text-tools/place-issues'
import type { Analysis } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

const EMPTY_ANALYSIS: Analysis = { issues: [], sentenceCount: 0 }

type UseTextToolsOptions = {
	editor: Editor | null
	enabled: boolean
	rules: TextToolRuleId[]
	targetAge: number
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
}: UseTextToolsOptions) {
	const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const analyzerRef = useRef<Analyzer | null>(null)

	const debouncedRevision = useDocumentRevision(editor)

	// Re-run when the rules or the target age change, not just when the text
	// does. A string, because `viewOptions.textToolRules` is rebuilt by its zod
	// `.transform` on every config broadcast - depending on the array itself
	// would re-analyse every time any *other* view option changed, in every tab.
	const ruleKey = rules.join(',')
	const rulesRef = useRef(rules)
	rulesRef.current = rules

	// Split from the analysis effect below so it runs on the transition only.
	// Sharing that effect's dependencies would dispatch a no-op transaction
	// every debounce tick while the tools are off, for the whole session.
	useEffect(() => {
		if (enabled || !editor) return

		analyzerRef.current?.dispose()
		analyzerRef.current = null
		setAnalysis(EMPTY_ANALYSIS)
		setIsAnalyzing(false)
		editor.commands.setTextToolIssues([])
	}, [editor, enabled])

	useEffect(() => {
		if (!editor || !enabled) return

		const rules = rulesRef.current
		let cancelled = false
		setIsAnalyzing(true)

		const run = async () => {
			if (!analyzerRef.current) {
				const { createAnalyzer } =
					await import('@/lib/text-tools/analyze-client')
				if (cancelled) return
				analyzerRef.current = createAnalyzer()
			}

			const documentText = getDocumentText(editor.state.doc)
			const result = await analyzerRef.current.analyze(
				documentText.text,
				rules,
				targetAge
			)

			// The document may have moved on while the worker was busy. Positions
			// derived from the old snapshot would land in the wrong place, and the
			// debounce already has the next run queued.
			if (cancelled || editor.isDestroyed) return

			setAnalysis(result)
			setIsAnalyzing(false)
			editor.commands.setTextToolIssues(
				placeIssues(result.issues, documentText, new Set(rules))
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
	}, [editor, enabled, ruleKey, targetAge, debouncedRevision])

	// Tear the worker down for good when the editor unmounts.
	useEffect(() => {
		return () => {
			analyzerRef.current?.dispose()
			analyzerRef.current = null
		}
	}, [])

	return { analysis, isAnalyzing }
}
