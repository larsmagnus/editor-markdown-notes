/** A range in `previous`, in UTF-16 code units, to replace with `text`. */
export type TextReplacement = { start: number; end: number; text: string }

/**
 * The smallest single replacement that turns `previous` into `next`, or
 * `null` when they are identical.
 *
 * Finds the longest common prefix, then the longest common suffix, and
 * reports only the span between them as changed - not the whole document.
 * Once the document stays dirty rather than being saved on every sync
 * (`document-updates.ts`), a full-range replace would make every keystroke a
 * new entry on VS Code's own text undo stack, collapse folding, and move the
 * caret in any other editor open on the same file. `null` on no change is
 * also the cheapest possible way to skip a sync that echoes back unchanged.
 *
 * The prefix and suffix scans are capped so they cannot overlap: `previous`
 * and `next` may share a run of a repeated character straddling the actual
 * edit (`"aaa"` -> `"aXa"`), and without the cap the prefix and suffix scans
 * would each independently claim some of the same characters.
 *
 * Safe across a split UTF-16 surrogate pair: the prefix and suffix are equal
 * on both sides of the boundary by construction, so applying the reported
 * replacement to `previous` reproduces `next` exactly regardless of where
 * that boundary happens to fall.
 */
export function computeMinimalReplacement(
	previous: string,
	next: string
): TextReplacement | null {
	if (previous === next) return null

	const maxCommon = Math.min(previous.length, next.length)

	let prefix = 0
	while (prefix < maxCommon && previous[prefix] === next[prefix]) {
		prefix++
	}

	const maxSuffix = maxCommon - prefix
	let suffix = 0
	while (
		suffix < maxSuffix &&
		previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
	) {
		suffix++
	}

	return {
		start: prefix,
		end: previous.length - suffix,
		text: next.slice(prefix, next.length - suffix),
	}
}
