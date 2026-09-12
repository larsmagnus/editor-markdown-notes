import { CheckCircle, TriangleAlert } from 'lucide-react'

import { issueClassName } from '#src/lib/text-tools/issue-class-name'
import type { TextToolRule } from '#src/lib/text-tools/rules'

type TextToolsRuleExampleProps = {
	example: NonNullable<TextToolRule['example']>
}

/** A rewrite, next to the flawed sentence it replaces, marked as the editor marks it. */
export function TextToolsRuleExample({ example }: TextToolsRuleExampleProps) {
	return (
		<dl className="flex flex-col gap-2">
			<div className="flex flex-col gap-1 bg-green-300/15 dark:bg-green-300/10 p-2 rounded-md">
				<dt className="text-xs flex items-center gap-1 text-muted-foreground">
					<CheckCircle className="size-3 text-green-700 dark:text-green-300" />{' '}
					Try
				</dt>
				<dd>{example.after}</dd>
			</div>
			<div className="flex flex-col gap-1 bg-amber-300/15 dark:bg-amber-300/10 p-2 rounded-md">
				<dt className="text-xs flex items-center gap-1 text-muted-foreground">
					<TriangleAlert className="size-3 text-amber-700 dark:text-amber-300" />{' '}
					Instead of
				</dt>
				<dd>
					{example.before.map((segment, index) => (
						<span
							// Freeform prose: the same run can appear twice in one
							// example, so only its position is unique.
							key={index}
							className={
								segment.flagged ? issueClassName(example.severity) : undefined
							}
						>
							{segment.text}
						</span>
					))}
				</dd>
			</div>
		</dl>
	)
}
