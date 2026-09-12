import type { Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'

import { useAnalysis } from '#src/hooks/use-analysis'
import type { AnalysisRequest } from '#src/hooks/use-analysis-options'
import type { AnalyzerHandle } from '#src/hooks/use-analyzer'
import { useDocumentRevision } from '#src/hooks/use-document-revision'
import { getDocumentText } from '#src/lib/text-tools/document-text'
import { placeIssues } from '#src/lib/text-tools/place-issues'

type UseTextToolsOptions = AnalysisRequest &
	AnalyzerHandle & {
		editor: Editor | null
	}

/**
 * Runs the writing checks over the live editor's document and pushes the
 * results into the decoration plugin, via the shared `useAnalysis`.
 */
export function useTextTools({
	editor,
	enabled,
	rules,
	targetAge,
	spellingLanguage,
	spellingIgnoreWords,
	getAnalyzer,
	disposeAnalyzer,
}: UseTextToolsOptions) {
	const debouncedRevision = useDocumentRevision(editor)

	// `viewOptions.textToolRules` is rebuilt by its zod `.transform` on every
	// config broadcast (see `use-analysis-options.ts`), so a ref keeps the
	// placement effect below from re-dispatching on an unrelated settings
	// change - it only needs to react once `analysis`/`analyzedText` land.
	const rulesRef = useRef(rules)
	rulesRef.current = rules

	const { analysis, analyzedText, isAnalyzing, hasSpellingFailed } =
		useAnalysis({
			getFlattenedText: () =>
				editor ? getDocumentText(editor.state.doc) : null,
			revisionKey: debouncedRevision,
			enabled: enabled && editor !== null,
			rules,
			targetAge,
			spellingLanguage,
			spellingIgnoreWords,
			getAnalyzer,
			disposeAnalyzer,
		})

	useEffect(() => {
		if (!editor || editor.isDestroyed) return

		if (!analyzedText) {
			editor.commands.setTextToolIssues([])
			return
		}

		editor.commands.setTextToolIssues(
			placeIssues(analysis.issues, analyzedText, new Set(rulesRef.current))
		)
	}, [editor, analysis, analyzedText])

	return { analysis, isAnalyzing, hasSpellingFailed }
}
