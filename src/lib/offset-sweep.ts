import type { SourcePlacedIssue } from '#src/lib/text-tools/place-source-issues'

/**
 * A lookup of the span covering an offset, for offsets asked in increasing
 * order over spans that are sorted and never overlap - one pass over the
 * spans for the whole note, where searching them all for every run was
 * quadratic in a long note's length and ran on every keystroke.
 */
export function sweep<T>(
	spans: readonly T[],
	bounds: (span: T) => [number, number]
): (offset: number) => T | undefined {
	const sorted = [...spans].sort((a, b) => bounds(a)[0] - bounds(b)[0])
	let index = 0
	return (offset) => {
		while (index < sorted.length && bounds(sorted[index])[1] <= offset) index++
		const span = sorted[index]
		return span && bounds(span)[0] <= offset ? span : undefined
	}
}

/**
 * The narrowest issue covering an offset, for offsets asked in increasing
 * order. Issues may overlap - a sentence-level one around a misspelt word -
 * so the ones covering the current offset are kept as a set.
 */
export function narrowestIssueSweep(
	issues: readonly SourcePlacedIssue[]
): (offset: number) => SourcePlacedIssue | undefined {
	const pending = [...issues].sort((a, b) => a.from - b.from)
	let active: SourcePlacedIssue[] = []
	let index = 0
	return (offset) => {
		while (index < pending.length && pending[index].from <= offset) {
			active.push(pending[index++])
		}
		active = active.filter((issue) => issue.to > offset)
		return active.reduce<SourcePlacedIssue | undefined>(
			(narrowest, issue) =>
				!narrowest || issue.to - issue.from < narrowest.to - narrowest.from
					? issue
					: narrowest,
			undefined
		)
	}
}
