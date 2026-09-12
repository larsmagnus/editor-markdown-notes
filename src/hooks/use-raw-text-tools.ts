import { useMemo, useRef } from 'react'
import { useDebounceValue } from 'usehooks-ts'

import { useAnalysis } from '#src/hooks/use-analysis'
import type { AnalyzerHandle } from '#src/hooks/use-analyzer'
import { useSharedAnalyzer } from '#src/hooks/use-analyzer'
import { ANALYSIS_DEBOUNCE_MS } from '#src/hooks/use-document-revision'
import { useSettings } from '#src/hooks/use-settings'
import { getMarkdownSourceText } from '#src/lib/text-tools/markdown-source-text'
import type { SourcePlacedIssue } from '#src/lib/text-tools/place-source-issues'
import { placeSourceIssues } from '#src/lib/text-tools/place-source-issues'

/**
 * The raw editor's counterpart to `use-text-tools.ts`: runs the same writing
 * checks over the raw markdown source string instead of the ProseMirror
 * document, via the shared `useAnalysis`, and returns placed issues for
 * `EditorModeRaw` to render rather than dispatching into a TipTap command.
 *
 * Reads its own rule/language settings, the same way `use-markdown-editor.ts`
 * does for the live editor, so `EditorModeRaw` only has to hand over `draft`.
 * `analysis-parity.test.ts` is what guarantees this can never disagree with
 * the live editor's own highlights: both run the exact same pipeline against
 * provably identical flattened text.
 */
export function useRawTextTools(
	draft: string,
	active: boolean,
	analyzer?: AnalyzerHandle
): SourcePlacedIssue[] {
	const { viewOptions, settings } = useSettings()
	const { getAnalyzer, disposeAnalyzer } = useSharedAnalyzer(analyzer)
	const [debouncedDraft] = useDebounceValue(draft, ANALYSIS_DEBOUNCE_MS)

	// Rebuilt by its zod `.transform` on every config broadcast (see
	// `use-analysis-options.ts`), so a ref keeps the memo below from
	// recomputing on an unrelated settings change.
	const rulesRef = useRef(viewOptions.textToolRules)
	rulesRef.current = viewOptions.textToolRules

	const { analysis, analyzedText } = useAnalysis({
		getFlattenedText: () => getMarkdownSourceText(debouncedDraft),
		revisionKey: debouncedDraft,
		enabled: active && viewOptions.textTools,
		rules: viewOptions.textToolRules,
		targetAge: settings.textToolsTargetAge,
		spellingLanguage: viewOptions.spellingLanguage,
		spellingIgnoreWords: viewOptions.spellingIgnoreWords,
		getAnalyzer,
		disposeAnalyzer,
	})

	return useMemo(() => {
		if (!analyzedText) return []
		return placeSourceIssues(
			analysis.issues,
			analyzedText,
			new Set(rulesRef.current)
		)
	}, [analysis, analyzedText])
}
