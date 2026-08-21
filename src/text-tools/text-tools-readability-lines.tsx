import type { ReadabilityLine } from '@/lib/text-tools/summarize'
import type { IssueSeverity } from '@/lib/text-tools/types'
import { cn } from '@/lib/utils'

/** Red for the harder tier, amber for the softer one. */
const SEVERITY_CLASS_NAMES: Partial<Record<IssueSeverity, string>> = {
	'very-hard': 'bg-red-500/15 text-red-700 dark:text-red-300',
	hard: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

type TextToolsReadabilityLinesProps = {
	lines: ReadabilityLine[]
}

/** How much of the note reads as hard, by tier. */
export function TextToolsReadabilityLines({
	lines,
}: TextToolsReadabilityLinesProps) {
	if (lines.length === 0) return null

	return (
		<ul className="flex flex-col gap-1">
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
