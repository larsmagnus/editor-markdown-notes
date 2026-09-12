import { useCurrentEditor } from '@tiptap/react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#src/components/ui/accordion'
import { findIssueRange } from '#src/editor/extensions/text-tools/text-tools-extension'
import { selectRawRange } from '#src/editor/select-raw-range'
import { useRawTextToolsLocation } from '#src/hooks/use-raw-text-tools-location'
import type { RuleGroup } from '#src/lib/text-tools/summarize'
import type { TextIssue } from '#src/lib/text-tools/types'
import { TextToolsRuleInfo } from '#src/text-tools/text-tools-rule-info'

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
	const raw = useRawTextToolsLocation()

	const goToIssue = (issue: TextIssue) => {
		if (raw.active) {
			// Placed fresh on every analysis rather than decoration-tracked, so the
			// match by identity below is exact as of the latest pass - there is no
			// stale range to reconcile against the way the live editor's decorations
			// are read back below.
			const match = raw.issues.find(
				(candidate) =>
					candidate.start === issue.start && candidate.ruleId === issue.ruleId
			)
			if (match) selectRawRange(match.from, match.to)
			return
		}

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
			<Accordion defaultValue={[group.ruleId]}>
				<AccordionItem value={group.ruleId}>
					<div className="flex gap-1 items-center justify-between w-full *:data-orientation:w-full">
						<AccordionTrigger className="text-xs w-full font-medium tracking-wide text-muted-foreground uppercase">
							{group.label} ({group.issues.length})
						</AccordionTrigger>
						<TextToolsRuleInfo ruleId={group.ruleId} />
					</div>
					<AccordionContent>
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
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</section>
	)
}
