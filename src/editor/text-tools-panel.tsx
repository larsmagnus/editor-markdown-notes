import { useCurrentEditor } from '@tiptap/react'

import { findIssueRange } from '@/editor/text-tools-extension'
import { RULES } from '@/lib/text-tools/rules'
import { summarize } from '@/lib/text-tools/summarize'
import type { Analysis, TextIssue } from '@/lib/text-tools/types'
import { cn } from '@/lib/utils'
import type { TextToolRuleId } from '@/shared/messages'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

type TextToolsPanelProps = {
	analysis: Analysis
	isAnalyzing: boolean
	rules: TextToolRuleId[]
	setRules: (rules: TextToolRuleId[]) => void
}

export function TextToolsPanel({
	analysis,
	isAnalyzing,
	rules,
	setRules,
}: TextToolsPanelProps) {
	const { editor } = useCurrentEditor()
	const summary = summarize(analysis, rules)

	const toggleRule = (ruleId: TextToolRuleId, checked: boolean) => {
		// Rebuilt from the canonical order so the persisted list never depends on
		// the order the user clicked things in.
		setRules(
			TEXT_TOOL_RULE_IDS.filter((id) =>
				id === ruleId ? checked : rules.includes(id)
			)
		)
	}

	const goToIssue = (issue: TextIssue) => {
		if (!editor) return

		// Asks the decoration where the issue is now. Its own `start`/`end` are
		// offsets into the snapshot that was analysed, which any edit since then
		// has invalidated - the decorations have been mapped forward, they have not.
		const range = findIssueRange(editor.state, issue.start)
		if (!range) return

		editor.chain().focus().setTextSelection(range).scrollIntoView().run()
	}

	return (
		<aside
			aria-label="Text tools"
			className="sticky top-16 flex max-h-[calc(100vh-5rem)] w-72 shrink-0 flex-col gap-4 overflow-auto rounded-md border bg-muted/30 p-3 text-sm"
		>
			<div>
				<h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Text tools
				</h2>
				<p className="mt-1 text-muted-foreground" aria-live="polite">
					{isAnalyzing
						? 'Checking…'
						: summary.total === 0
							? 'Nothing to flag.'
							: `${summary.total} ${summary.total === 1 ? 'suggestion' : 'suggestions'}`}
				</p>
			</div>

			{summary.readability.length > 0 && (
				<ul className="flex flex-col gap-1">
					{summary.readability.map((line) => (
						<li
							key={line.severity}
							className={cn(
								'rounded px-2 py-1',
								line.severity === 'very-hard'
									? 'bg-red-500/15 text-red-700 dark:text-red-300'
									: 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
							)}
						>
							{line.text}
						</li>
					))}
				</ul>
			)}

			<fieldset className="flex flex-col gap-1.5">
				<legend className="sr-only">Checks to run</legend>
				{TEXT_TOOL_RULE_IDS.map((ruleId) => (
					<label
						key={ruleId}
						className="flex items-center gap-2"
						title={RULES[ruleId].description}
					>
						<input
							type="checkbox"
							checked={rules.includes(ruleId)}
							onChange={(event) => toggleRule(ruleId, event.target.checked)}
						/>
						{RULES[ruleId].label}
					</label>
				))}
			</fieldset>

			{summary.groups.map((group) => (
				<section key={group.ruleId} className="flex flex-col gap-1">
					<h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{group.label} ({group.issues.length})
					</h3>
					<ul className="flex flex-col gap-1">
						{group.issues.map((issue) => (
							<li key={`${issue.start}-${issue.ruleId}-${issue.actual}`}>
								<button
									type="button"
									onClick={() => goToIssue(issue)}
									className="w-full rounded px-2 py-1 text-left hover:bg-accent"
								>
									<span className="font-medium">
										{issue.ruleId === 'readability'
											? truncate(issue.actual)
											: issue.actual}
									</span>
									{issue.expected.length > 0 && (
										<span className="text-muted-foreground">
											{' → '}
											{issue.expected.join(', ')}
										</span>
									)}
								</button>
							</li>
						))}
					</ul>
				</section>
			))}
		</aside>
	)
}

/** Readability findings quote the whole sentence, which is too long for a list. */
function truncate(value: string) {
	return value.length > 60 ? `${value.slice(0, 57)}…` : value
}
