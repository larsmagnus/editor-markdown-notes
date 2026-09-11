/**
 * `text` is the one already-worded line both the panel and the MCP server
 * display, so "Document temperature: …" is written once here rather than
 * separately in `text-tools-polarity-line.tsx` and `mcp/summary-lines.ts` -
 * `label` still rides along on its own for the panel's colour lookup.
 */
export type PolarityTemperature = { score: number; label: string; text: string }

/**
 * `polarity`'s own scale runs roughly -5..5 per charged word (AFINN-165), so a
 * document average sits far closer to zero. Tiers are on the per-word average
 * rather than the raw total, so a longer note isn't read as more charged
 * purely for having more words.
 */
const POLARITY_TIERS: Array<{ max: number; label: string }> = [
	{ max: -0.15, label: 'very negative' },
	{ max: -0.02, label: 'negative' },
	{ max: 0.02, label: 'neutral' },
	{ max: 0.15, label: 'positive' },
	{ max: Number.POSITIVE_INFINITY, label: 'very positive' },
]

/** The document's overall sentiment, from its average per-word polarity score. */
export function polarityTemperature(score: number): PolarityTemperature {
	const label =
		POLARITY_TIERS.find((tier) => score <= tier.max)?.label ?? 'neutral'

	return { score, label, text: `Document temperature: ${label}` }
}
