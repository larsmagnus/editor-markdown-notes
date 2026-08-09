import { useCurrentEditor } from '@tiptap/react'

import { findIssueRange } from '@/editor/text-tools-extension'
import type { RuleGroup } from '@/lib/text-tools/summarize'
import type { TextIssue } from '@/lib/text-tools/types'

/** Readability findings quote the whole sentence, which is too long for a list. */
function truncate(value: string) {
	return value.length > 60 ? `${value.slice(0, 57)}…` : value
}

type TextToolsIssueGroupProps = {
	group: RuleGroup
}

/** One rule's findings, each a button that selects the text it flagged. */
export function TextToolsIssueGroup({ group }: TextToolsIssueGroupProps) {
	const { editor } = useCurrentEditor()

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
		<section className="flex flex-col gap-1">
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
	)
}
