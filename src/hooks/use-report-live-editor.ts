import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'

import { EMPTY_ANALYSIS } from '#src/hooks/use-analysis'
import type { Analysis } from '#src/lib/text-tools/types'

export interface TextToolsState {
	analysis: Analysis
	isAnalyzing: boolean
	hasSpellingFailed: boolean
}

/** What a consumer of `useReportLiveEditor` should show once reporting stops. */
export const EMPTY_TEXT_TOOLS_STATE: TextToolsState = {
	analysis: EMPTY_ANALYSIS,
	isAnalyzing: false,
	hasSpellingFailed: false,
}

interface UseReportLiveEditorOptions extends TextToolsState {
	editor: Editor | null
	onAnalysisChange?: (state: TextToolsState) => void
	onEditorChange?: (editor: Editor | null) => void
}

/**
 * Reports `EditorModeLive`'s TipTap editor and text-tools analysis up to
 * `EditorBody`, which renders the shared `TextToolsAside` and its
 * `EditorContext.Provider` as `EditorModeLive`'s siblings.
 *
 * Both effects clean up on unmount, not just on a dependency change - a crash
 * caught by `EditorModeLive`'s surrounding `AppErrorBoundary` unmounts it
 * without another render to report through, and without this, `EditorBody`
 * would keep handing the sidebar a destroyed editor and stale analysis.
 */
export function useReportLiveEditor({
	editor,
	analysis,
	isAnalyzing,
	hasSpellingFailed,
	onAnalysisChange,
	onEditorChange,
}: UseReportLiveEditorOptions) {
	useEffect(() => {
		onAnalysisChange?.({ analysis, isAnalyzing, hasSpellingFailed })
		return () => onAnalysisChange?.(EMPTY_TEXT_TOOLS_STATE)
	}, [analysis, isAnalyzing, hasSpellingFailed, onAnalysisChange])

	useEffect(() => {
		onEditorChange?.(editor)
		return () => onEditorChange?.(null)
	}, [editor, onEditorChange])
}
