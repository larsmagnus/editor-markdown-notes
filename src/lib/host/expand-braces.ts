/**
 * Every alternative a glob's `{a,b}` groups describe, as brace-free globs:
 * `**\/*.{js,map}` becomes `**\/*.js` and `**\/*.map`. Nested groups expand
 * too. An unbalanced brace is left in place for the caller to reject.
 */
export function expandBraces(pattern: string): string[] {
	const open = pattern.indexOf('{')
	const close = open === -1 ? -1 : matchingBrace(pattern, open)
	if (close === -1) return [pattern]

	const prefix = pattern.slice(0, open)
	const suffix = pattern.slice(close + 1)

	return splitTopLevel(pattern.slice(open + 1, close)).flatMap((option) =>
		expandBraces(`${prefix}${option}${suffix}`)
	)
}

/** The index of the `}` closing the `{` at `open`, or -1 when there is none. */
function matchingBrace(pattern: string, open: number): number {
	let depth = 0

	for (let index = open; index < pattern.length; index++) {
		if (pattern[index] === '{') depth++
		if (pattern[index] === '}') depth--
		if (depth === 0) return index
	}

	return -1
}

/** Splits a group's contents on its own commas, not those of a nested group. */
function splitTopLevel(group: string): string[] {
	const options = ['']
	let depth = 0

	for (const character of group) {
		if (character === '{') depth++
		if (character === '}') depth--

		if (character === ',' && depth === 0) options.push('')
		else options[options.length - 1] += character
	}

	return options
}
