import { TextToolsIssueGroup } from '@/editor/text-tools-issue-group'
import { TextToolsReadabilityLines } from '@/editor/text-tools-readability-lines'
import { TextToolsRuleCheckboxes } from '@/editor/text-tools-rule-checkboxes'
import { TextToolsStatus } from '@/editor/text-tools-status'
import { summarize } from '@/lib/text-tools/summarize'
import type { Analysis } from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

type TextToolsPanelProps = {
	analysis: Analysis
	isAnalyzing: boolean
	rules: TextToolRuleId[]
	setRules: (rules: TextToolRuleId[]) => void
}

/** The writing checks, beside the document. */
export function TextToolsPanel({
	analysis,
	isAnalyzing,
	rules,
	setRules,
}: TextToolsPanelProps) {
	const summary = summarize(analysis, rules)

	return (
		<aside
			aria-label="Text tools"
			className="sticky top-16 flex max-h-[calc(100vh-5rem)] w-72 shrink-0 flex-col overflow-auto rounded-md border bg-muted/30 text-sm"
		>
			<div className="flex items-center justify-between gap-2 border-b p-3 py-1.5 min-h-10 bg-muted/50">
				<h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Text tools
				</h2>
				<TextToolsStatus isAnalyzing={isAnalyzing} total={summary.total} />
			</div>

			<div className="flex flex-col gap-3 p-3">
				<TextToolsReadabilityLines lines={summary.readability} />

				<TextToolsRuleCheckboxes rules={rules} setRules={setRules} />

				{summary.groups.map((group) => (
					<TextToolsIssueGroup key={group.ruleId} group={group} />
				))}
			</div>
		</aside>
	)
}
