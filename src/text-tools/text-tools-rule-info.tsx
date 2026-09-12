import { cn } from 'cn'
import { Info } from 'lucide-react'
import type { ComponentProps } from 'react'

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
import type { TextToolRule } from '#src/lib/text-tools/rules'
import { TextToolsRuleExample } from '#src/text-tools/text-tools-rule-example'

type TextToolsRuleInfoProps = {
	rule: TextToolRule
} & ComponentProps<'button'>

/** What one check looks for and why, behind an info button. */
export function TextToolsRuleInfo({ className, rule }: TextToolsRuleInfoProps) {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className={cn('text-muted-foreground', className)}
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
				{rule.example && <TextToolsRuleExample example={rule.example} />}
				<PopoverArrow />
			</PopoverContent>
		</Popover>
	)
}
