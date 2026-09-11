import type { summarize } from '#src/lib/text-tools/summarize'

/**
 * The document-level lines a check report surfaces: readability's per-tier
 * fractions, plus polarity's overall temperature and dash overuse's rate,
 * each only when its rule ran and found something.
 */
export function summaryLines(
	ruleSummary: ReturnType<typeof summarize>
): string[] {
	const lines = ruleSummary.readability.map((line) => line.text)

	if (ruleSummary.polarity) lines.push(ruleSummary.polarity.text)
	if (ruleSummary.dashOveruse) lines.push(ruleSummary.dashOveruse.text)

	return lines
}
