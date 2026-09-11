import { cn } from 'cn'

import type { PolarityTemperature } from '#src/lib/text-tools/polarity-temperature'

/** Warm for positive tiers, cool for negative ones, muted for neutral. */
const LABEL_CLASS_NAMES: Record<string, string> = {
	'very negative': 'bg-red-500/15 text-red-700 dark:text-red-300',
	negative: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
	neutral: 'bg-muted text-muted-foreground',
	positive: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	'very positive': 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300',
}

type TextToolsPolarityLineProps = {
	temperature: PolarityTemperature | null
}

/** The document's overall sentiment, alongside the per-word charged-language markers. */
export function TextToolsPolarityLine({
	temperature,
}: TextToolsPolarityLineProps) {
	if (!temperature) return null

	return (
		<p
			className={cn('rounded px-2 py-1', LABEL_CLASS_NAMES[temperature.label])}
		>
			{temperature.text}
		</p>
	)
}
