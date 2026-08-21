/**
 * An asterisk only risks being reparsed as emphasis if CommonMark would call
 * it left- or right-flanking (not surrounded by whitespace on the side that
 * matters). A flanking asterisk with no other flanking asterisk anywhere in
 * the string can never pair up, so it stays literal either way.
 */
export function flankingAsteriskOffsets(str: string): Set<number> {
	const offsets = new Set<number>()
	for (let i = 0; i < str.length; i++) {
		if (str[i] !== '*') continue
		const flanking =
			(i + 1 < str.length && !/\s/.test(str[i + 1])) ||
			(i > 0 && !/\s/.test(str[i - 1]))
		if (flanking) offsets.add(i)
	}
	return offsets
}

export function hasFlankingAsteriskPartner(
	offsets: Set<number>,
	offset: number
): boolean {
	return offsets.has(offset) && offsets.size > 1
}

interface BacktickRun {
	start: number
	length: number
}

/**
 * A CommonMark code span pairs a backtick run with the next run of the exact
 * same length, so a lone run (or one whose length matches nothing else) can
 * never open or close a span and stays literal.
 */
export function backtickRuns(str: string): BacktickRun[] {
	return [...str.matchAll(/`+/g)].map((match) => ({
		start: match.index ?? 0,
		length: match[0].length,
	}))
}

export function hasMatchingBacktickRun(
	runs: BacktickRun[],
	offset: number
): boolean {
	const run = runs.find((r) => offset >= r.start && offset < r.start + r.length)
	if (!run) return false
	return runs.some((r) => r !== run && r.length === run.length)
}
