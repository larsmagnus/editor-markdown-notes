import { summarize } from '@/lib/text-tools/summarize'
import type { Analysis } from '@/lib/text-tools/types'
import type { SpellingLanguage, TextToolRuleId } from '@/shared/messages'
import { TextToolsIssueGroup } from '@/text-tools/text-tools-issue-group'
import { TextToolsReadabilityLines } from '@/text-tools/text-tools-readability-lines'
import { TextToolsRuleCheckboxes } from '@/text-tools/text-tools-rule-checkboxes'
import { TextToolsStats } from '@/text-tools/text-tools-stats'
import { TextToolsStatus } from '@/text-tools/text-tools-status'

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
			aria-label="Text tools"
			className="sticky top-16 overflow-y-hidden flex max-h-[calc(100vh-5rem)] w-72 shrink-0 flex-col rounded-md border bg-muted/30 text-sm"
		>
			<div className="flex items-center justify-between gap-2 border-b p-3 py-1.5 min-h-10 bg-muted/50">
				<h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Text tools
				</h2>
				<TextToolsStatus isAnalyzing={isAnalyzing} total={summary.total} />
			</div>

			<div className="flex flex-col gap-3 p-3 scroll-fade overflow-y-auto">
				<TextToolsStats sentenceCount={analysis.sentenceCount} />

				<TextToolsReadabilityLines lines={summary.readability} />

				<TextToolsRuleCheckboxes
					rules={rules}
					setRules={setRules}
					spellingLanguage={spellingLanguage}
					setSpellingLanguage={setSpellingLanguage}
					hasSpellingFailed={hasSpellingFailed}
				/>

				{summary.groups.map((group) => (
					<TextToolsIssueGroup key={group.ruleId} group={group} />
				))}
			</div>
		</aside>
	)
}
