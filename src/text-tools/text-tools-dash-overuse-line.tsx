import type { DashOveruseSummary } from '#src/lib/text-tools/dash-rate-summary'

type TextToolsDashOveruseLineProps = {
	summary: DashOveruseSummary | null
}

/** The document-wide dash rate, alongside the per-sentence and per-cluster markers. */
export function TextToolsDashOveruseLine({
	summary,
}: TextToolsDashOveruseLineProps) {
	if (!summary) return null

	return (
		<p className="rounded px-2 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
			{summary.text}
		</p>
	)
}
