import { Info } from 'lucide-react'

import { PopoverArrow } from '@/components/popover-arrow'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover'
import { issueClassName } from '@/lib/text-tools/issue-class-name'
import { RULES } from '@/lib/text-tools/rules'
import type { TextToolRuleId } from '@/shared/messages'

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
			<PopoverContent side="left" align="start" className="text-xs">
				<PopoverHeader>
					<PopoverTitle>{rule.label}</PopoverTitle>
					<PopoverDescription className="text-xs">
						{rule.description}
					</PopoverDescription>
				</PopoverHeader>
				<p className="text-xs leading-relaxed">{rule.explanation}</p>
				<dl className="flex flex-col gap-1.5 rounded-md bg-muted/60 p-2 text-xs">
					<div className="flex flex-col gap-0.5">
						<dt className="text-muted-foreground">Try</dt>
						<dd>{rule.example.after}</dd>
					</div>
					<div className="flex flex-col gap-0.5">
						<dt className="text-muted-foreground">Instead of</dt>
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
