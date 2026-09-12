import LinkSkip from '#src/components/link-skip'
import { LIVE_EDITOR_ID } from '#src/editor/editor-mode-live-surface'
import {
	asSkipLinkClick,
	skipToEditor,
} from '#src/editor/extensions/focus-navigation/skip-target'
import { summarize } from '#src/lib/text-tools/summarize'
import type { Analysis } from '#src/lib/text-tools/types'
import type { SpellingLanguage, TextToolRuleId } from '#src/shared/messages'
import { TextToolsDashOveruseLine } from '#src/text-tools/text-tools-dash-overuse-line'
import { TextToolsIssueGroup } from '#src/text-tools/text-tools-issue-group'
import { TextToolsPolarityLine } from '#src/text-tools/text-tools-polarity-line'
import { TextToolsReadabilityLines } from '#src/text-tools/text-tools-readability-lines'
import { TextToolsRuleCheckboxes } from '#src/text-tools/text-tools-rule-checkboxes'
import { TextToolsStats } from '#src/text-tools/text-tools-stats'
import { TextToolsStatus } from '#src/text-tools/text-tools-status'

/** Where "Skip to text tools" (`layout.tsx`) focuses. */
export const TEXT_TOOLS_PANEL_ID = 'text-tools-panel'

type TextToolsPanelProps = {
	analysis: Analysis
	isAnalyzing: boolean
	rules: TextToolRuleId[]
	setRules: (rules: TextToolRuleId[]) => void
	spellingLanguage: SpellingLanguage
	setSpellingLanguage: (language: SpellingLanguage) => void
	hasSpellingFailed: boolean
}

/** The writing checks, beside the document. */
export function TextToolsPanel({
	analysis,
	isAnalyzing,
	rules,
	setRules,
	spellingLanguage,
	setSpellingLanguage,
	hasSpellingFailed,
}: TextToolsPanelProps) {
	const summary = summarize(analysis, rules)

	return (
		<aside
			id={TEXT_TOOLS_PANEL_ID}
			tabIndex={-1}
			aria-label="Text tools"
			className="sticky top-16 overflow-y-hidden flex max-h-[calc(100vh-5rem)] w-72 shrink-0 flex-col rounded-md border bg-muted/30 text-sm"
		>
			<LinkSkip
				href={`#${LIVE_EDITOR_ID}`}
				onClick={asSkipLinkClick(skipToEditor)}
				className="focus:top-auto focus:left-auto"
			>
				Skip to editor
			</LinkSkip>

			<div className="flex items-center justify-between gap-2 border-b p-3 py-1.5 min-h-10 bg-muted/50">
				<h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Text tools
				</h2>
				<TextToolsStatus isAnalyzing={isAnalyzing} total={summary.total} />
			</div>

			<div className="flex flex-col gap-1 p-3 scroll-fade overflow-y-auto">
				<div className="flex flex-col gap-2">
					<TextToolsStats sentenceCount={analysis.sentenceCount} />
					<TextToolsReadabilityLines
						overall={summary.overallReadability}
						lines={summary.readability}
					/>
					<TextToolsPolarityLine temperature={summary.polarity} />
					<TextToolsDashOveruseLine summary={summary.dashOveruse} />

					<TextToolsRuleCheckboxes
						rules={rules}
						setRules={setRules}
						spellingLanguage={spellingLanguage}
						setSpellingLanguage={setSpellingLanguage}
						hasSpellingFailed={hasSpellingFailed}
					/>
				</div>

				{summary.groups.map((group) => (
					<TextToolsIssueGroup key={group.ruleId} group={group} />
				))}
			</div>
		</aside>
	)
}
