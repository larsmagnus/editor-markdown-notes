import type { RelativeToken } from '#src/lib/syntax-highlight-tokens'

function commonPrefixLength(a: string, b: string): number {
	const max = Math.min(a.length, b.length)
	let i = 0
	while (i < max && a[i] === b[i]) i++
	return i
}

function commonSuffixLength(
	a: string,
	b: string,
	prefixLength: number
): number {
	const max = Math.min(a.length, b.length) - prefixLength
	let i = 0
	while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
	return i
}

/**
 * Carries tokens computed for `oldText` forward onto `newText`, the way
 * ProseMirror decorations map through a transaction rather than being
 * dropped and redrawn from nothing on every keystroke.
 *
 * A token can straddle the edit rather than sitting cleanly on one side of
 * it - Shiki colors a whole heading line, `**bold**` span, or fenced block as
 * one token, so retyping a heading's title (leaving its `### ` marker
 * untouched) is a mid-token edit, not a whole-token one. Splitting each token
 * at the edit boundary keeps the part still inside the untouched prefix or
 * suffix colored - shifting the suffix part by however much the edit changed
 * the text's length - and only drops color for the span actually inside the
 * edit; a whole-token drop would read as the marker itself losing its color
 * merely because something elsewhere in the same token changed.
 */
export function remapRelativeTokens(
	oldText: string,
	newText: string,
	tokens: RelativeToken[]
): RelativeToken[] {
	if (oldText === newText) return tokens

	const prefixLength = commonPrefixLength(oldText, newText)
	const suffixLength = commonSuffixLength(oldText, newText, prefixLength)
	const delta = newText.length - oldText.length
	const suffixStartInOld = oldText.length - suffixLength

	return tokens.flatMap((token) => {
		const tokenEnd = token.offset + token.length
		const fragments: RelativeToken[] = []

		const leftEnd = Math.min(tokenEnd, prefixLength)
		if (leftEnd > token.offset) {
			fragments.push({
				...token,
				offset: token.offset,
				length: leftEnd - token.offset,
			})
		}

		const rightStart = Math.max(token.offset, suffixStartInOld)
		if (rightStart < tokenEnd) {
			fragments.push({
				...token,
				offset: rightStart + delta,
				length: tokenEnd - rightStart,
			})
		}

		return fragments
	})
}
