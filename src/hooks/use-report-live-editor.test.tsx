import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
	EMPTY_TEXT_TOOLS_STATE,
	useReportLiveEditor,
} from '#src/hooks/use-report-live-editor'
import { createEditor } from '#src/test-utils/editor'

describe('useReportLiveEditor', () => {
	it('reports the editor and analysis on mount', () => {
		const editor = createEditor('Ship it.', { mount: true })
		const onAnalysisChange = vi.fn()
		const onEditorChange = vi.fn()
		const analysis = {
			issues: [],
			sentenceCount: 1,
			polarity: null,
			dashOveruse: null,
			overallReadability: null,
		}

		renderHook(() =>
			useReportLiveEditor({
				editor,
				analysis,
				isAnalyzing: false,
				hasSpellingFailed: false,
				onAnalysisChange,
				onEditorChange,
			})
		)

		expect(onEditorChange).toHaveBeenCalledWith(editor)
		expect(onAnalysisChange).toHaveBeenCalledWith({
			analysis,
			isAnalyzing: false,
			hasSpellingFailed: false,
		})
	})

	// A crash caught by `EditorModeLive`'s surrounding `AppErrorBoundary`
	// unmounts it without another render to report through - the destroyed
	// editor and stale analysis would otherwise linger in `EditorBody`'s state,
	// reachable through the sidebar's `EditorContext.Provider`.
	it('reports the editor and analysis as gone on unmount', () => {
		const editor = createEditor('Ship it.', { mount: true })
		const onAnalysisChange = vi.fn()
		const onEditorChange = vi.fn()

		const { unmount } = renderHook(() =>
			useReportLiveEditor({
				editor,
				analysis: {
					issues: [],
					sentenceCount: 1,
					polarity: null,
					dashOveruse: null,
					overallReadability: null,
				},
				isAnalyzing: false,
				hasSpellingFailed: false,
				onAnalysisChange,
				onEditorChange,
			})
		)
		onAnalysisChange.mockClear()
		onEditorChange.mockClear()

		unmount()

		expect(onEditorChange).toHaveBeenCalledWith(null)
		expect(onAnalysisChange).toHaveBeenCalledWith(EMPTY_TEXT_TOOLS_STATE)
	})
})
