/**
 * The offset within `rest` at which a fenced construct's content ends, or
 * `null` while no closing marker line is present.
 *
 * The `m` flag is load-bearing. Without it `$` matches only the end of the
 * whole string, so a block with any trailing newline after its closing fence
 * never matches and the fence line is swept into the content as if it were
 * code. `m` also makes this the first matching line, which is the
 * CommonMark-correct answer for a fence that closes before the end.
 */
export function findClosingFence(rest: string, marker: string): number | null {
	const close = new RegExp(`(^|\\n)${marker}[ \\t]*$`, 'm').exec(rest)
	return close ? close.index : null
}
