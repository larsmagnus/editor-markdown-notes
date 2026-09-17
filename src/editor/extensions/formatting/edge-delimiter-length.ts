export function edgeDelimiterLength(
	text: string,
	delimiter: string,
	edge: 'open' | 'close'
): number {
	const has =
		edge === 'open' ? text.startsWith(delimiter) : text.endsWith(delimiter)
	return has ? delimiter.length : 0
}
