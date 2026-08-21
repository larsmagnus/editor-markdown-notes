import { AppErrorBoundary } from '@/components/app-error-boundary'
import { useSettings } from '@/hooks/use-settings'
import type { Analysis } from '@/lib/text-tools/types'
import { TextToolsPanel } from '@/text-tools/text-tools-panel'

type TextToolsAsideProps = {
	analysis: Analysis
	isAnalyzing: boolean
	hasSpellingFailed: boolean
}

/**
 * The text tools panel, wired to the view options that switch it on.
 *
 * Imported statically, not through `lazy`. Suspending anywhere inside the
 * editor tree wedges the renderer: unwinding to the boundary re-renders
 * `EditorContent`, whose mount does a `flushSync`, which schedules the render
 * that suspends again — a loop that never yields, so the tab hangs and Chrome
 * kills it. Nothing is lost by importing it: retext reaches the app through the
 * worker and `analyze-client`'s `await import()`, and this file's own graph is
 * a handful of UI components. Everything else in the editor that loads on
 * demand — mermaid, shiki — uses `await import()` inside an effect for the same
 * reason.
 */
export function TextToolsAside({
	analysis,
	isAnalyzing,
	hasSpellingFailed,
}: TextToolsAsideProps) {
	const { viewOptions, setViewOptions } = useSettings()

	if (!viewOptions.textTools) return null

	return (
		<AppErrorBoundary title="The writing tools">
			<TextToolsPanel
				analysis={analysis}
				isAnalyzing={isAnalyzing}
				hasSpellingFailed={hasSpellingFailed}
				rules={viewOptions.textToolRules}
				setRules={(textToolRules) => setViewOptions({ textToolRules })}
				spellingLanguage={viewOptions.spellingLanguage}
				setSpellingLanguage={(spellingLanguage) =>
					setViewOptions({ spellingLanguage })
				}
			/>
		</AppErrorBoundary>
	)
}
