import { CheckCircle, Info, TriangleAlert } from 'lucide-react'

import { PopoverArrow } from '#src/components/popover-arrow'
import { Button } from '#src/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '#src/components/ui/popover'
import { issueClassName } from '#src/lib/text-tools/issue-class-name'
import { RULES } from '#src/lib/text-tools/rules'
import type { TextToolRuleId } from '#src/shared/messages'

type TextToolsRuleInfoProps = {
	ruleId: TextToolRuleId
}

/** What one check looks for and why, behind an info button. */
export function TextToolsRuleInfo({ ruleId }: TextToolsRuleInfoProps) {
	const rule = RULES[ruleId]

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="text-muted-foreground"
						aria-label={`About ${rule.label}`}
					>
						<Info />
					</Button>
				}
			/>
			<PopoverContent side="left" align="start" className="text-sm">
				<PopoverHeader>
					<PopoverTitle>{rule.label}</PopoverTitle>
					<PopoverDescription className="text-xs">
						{rule.description}
					</PopoverDescription>
				</PopoverHeader>
				<p className="text-sm leading-relaxed">{rule.explanation}</p>
				<dl className="flex flex-col gap-2">
					<div className="flex flex-col gap-1 bg-green-300/15 dark:bg-green-300/10 p-2 rounded-md">
						<dt className="text-xs flex items-center gap-1 text-muted-foreground">
							<CheckCircle className="size-3 text-green-700 dark:text-green-300" />{' '}
							Try
						</dt>
						<dd>{rule.example.after}</dd>
					</div>
					<div className="flex flex-col gap-1 bg-amber-300/15 dark:bg-amber-300/10 p-2 rounded-md">
						<dt className="text-xs flex items-center gap-1 text-muted-foreground">
							<TriangleAlert className="size-3 text-amber-700 dark:text-amber-300" />{' '}
							Instead of
						</dt>
						<dd>
							{rule.example.before.map((segment, index) => (
								<span
									// Freeform prose: the same run can appear twice in one
									// example, so only its position is unique.
									key={index}
									className={
										segment.flagged
											? issueClassName(rule.example.severity)
											: undefined
									}
								>
									{segment.text}
								</span>
							))}
						</dd>
					</div>
				</dl>
				<PopoverArrow />
			</PopoverContent>
		</Popover>
	)
}
