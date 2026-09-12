import { cn } from 'cn'

import type { OverallReadability } from '#src/lib/text-tools/overall-readability'
import { OVERALL_READABILITY_RULE } from '#src/lib/text-tools/rules'
import type { ReadabilityLine } from '#src/lib/text-tools/summarize'
import type { IssueSeverity } from '#src/lib/text-tools/types'
import { TextToolsRuleInfo } from '#src/text-tools/text-tools-rule-info'

const RED = 'bg-red-500/15 text-red-700 dark:text-red-300'
const AMBER = 'bg-amber-500/15 text-amber-700 dark:text-amber-300'

/** Red for the harder tier, amber for the softer one. */
const SEVERITY_CLASS_NAMES: Partial<Record<IssueSeverity, string>> = {
	'very-hard': RED,
	hard: AMBER,
}

const OVERALL_CLASS_NAMES: Record<OverallReadability['label'], string> = {
	good: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	ok: AMBER,
	poor: RED,
}

type TextToolsReadabilityLinesProps = {
	overall: OverallReadability | null
	lines: ReadabilityLine[]
}

/** The document's overall reading difficulty, plus how much of it reads as hard, by tier. */
export function TextToolsReadabilityLines({
	overall,
	lines,
}: TextToolsReadabilityLinesProps) {
	if (!overall && lines.length === 0) return null

	return (
		<ul className="flex flex-col gap-1">
			{overall && (
				<li
					className={cn(
						'flex items-center justify-between gap-2 rounded px-2 py-1',
						OVERALL_CLASS_NAMES[overall.label]
					)}
				>
					{overall.text}
					<TextToolsRuleInfo
						className={OVERALL_CLASS_NAMES[overall.label]}
						rule={OVERALL_READABILITY_RULE}
					/>
				</li>
			)}
			{lines.map((line) => (
				<li
					key={line.severity}
					className={cn(
						'rounded px-2 py-1',
						SEVERITY_CLASS_NAMES[line.severity]
					)}
				>
					{line.text}
				</li>
			))}
		</ul>
	)
}
