/**
 * Zero-based index of the logical line a caret offset sits on - the count of
 * newlines before it, so a caret just after `\n` belongs to the next line.
 */
export function lineIndexAt(text: string, offset: number): number {
	let index = 0
	for (let position = 0; position < offset; position++) {
		if (text[position] === '\n') index++
	}
	return index
}
