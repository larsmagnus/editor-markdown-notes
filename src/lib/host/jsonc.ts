/**
 * Parses JSON that may carry `//` and `/* *\/` comments and trailing commas,
 * the dialect VS Code's own bundled theme files are written in.
 *
 * Hand-rolled rather than pulling in `jsonc-parser`: the extension host
 * compiles via plain `tsc` and ships with `--no-dependencies`, so anything it
 * requires at runtime must resolve to a Node built-in or `vscode` itself, not
 * `node_modules`. A single-pass scanner tracking in-string state is also safer
 * than stripping comments with a regex, which would mangle a string value that
 * itself contains `//` or `/*` (`"description": "// example"`).
 */
export function parseJsonc(text: string): unknown {
	return JSON.parse(stripJsonc(text))
}

function stripJsonc(text: string): string {
	let result = ''
	let inString = false

	for (let index = 0; index < text.length; index++) {
		const char = text[index]
		const next = text[index + 1]

		if (inString) {
			result += char
			if (char === '\\') {
				// Copy the escaped character verbatim so an escaped quote (`\"`)
				// doesn't end the string early.
				index += 1
				result += text[index]
				continue
			}
			if (char === '"') inString = false
			continue
		}

		if (char === '"') {
			inString = true
			result += char
			continue
		}

		if (char === '/' && next === '/') {
			while (index < text.length && text[index] !== '\n') index += 1
			result += '\n'
			continue
		}

		if (char === '/' && next === '*') {
			index += 2
			while (
				index < text.length &&
				!(text[index] === '*' && text[index + 1] === '/')
			) {
				index += 1
			}
			index += 1
			continue
		}

		if (char === ',' && isTrailingComma(text, index)) continue

		result += char
	}

	return result
}

/** Whether the next non-whitespace, non-comment character after `index` closes an object or array. */
function isTrailingComma(text: string, index: number): boolean {
	let cursor = index + 1

	while (cursor < text.length) {
		const char = text[cursor]

		if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
			cursor += 1
			continue
		}

		if (char === '/' && text[cursor + 1] === '/') {
			while (cursor < text.length && text[cursor] !== '\n') cursor += 1
			continue
		}

		if (char === '/' && text[cursor + 1] === '*') {
			cursor += 2
			while (
				cursor < text.length &&
				!(text[cursor] === '*' && text[cursor + 1] === '/')
			) {
				cursor += 1
			}
			cursor += 2
			continue
		}

		return char === '}' || char === ']'
	}

	return false
}
