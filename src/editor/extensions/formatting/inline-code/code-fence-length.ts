/**
 * The shortest backtick run not already present as a run inside `text` - the
 * same "shortest unused fence" rule CommonMark backtick code spans need.
 * Using one more backtick than the longest run present (the naive approach)
 * would fence `` ```mermaid `` with four backticks when one already
 * disambiguates it.
 */
export function codeFenceLength(text: string): number {
	const runLengths = new Set(
		Array.from(text.matchAll(/`+/g), (m) => m[0].length)
	)
	let length = 1
	while (runLengths.has(length)) length++
	return length
}
