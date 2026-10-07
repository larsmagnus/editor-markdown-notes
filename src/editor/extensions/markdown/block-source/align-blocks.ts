import DiffMatchPatch, { DIFF_DELETE, DIFF_EQUAL } from 'diff-match-patch'

/** A run of blocks matched one to one, or a run of current blocks the incoming ones replace. */
export type BlockAlignment =
	| { kind: 'keep'; current: number; incoming: number }
	| {
			kind: 'replace'
			current: [number, number]
			incoming: [number, number]
	  }

/** Characters the diff runs over, one per distinct block, clear of the surrogate range. */
const FIRST_CODE = 0xe000
const LAST_CODE = 0xffff

/**
 * Each block as one character, equal blocks as equal characters, so a
 * character diff of the two strings is a block diff of the two notes. A
 * `null` block - one the author has changed - never equals anything.
 *
 * `null` when a note has more distinct blocks than there are characters to
 * spell them with.
 */
function encode(
	current: Array<string | null>,
	incoming: string[]
): [string, string] | null {
	const codes = new Map<string, string>()
	let next = FIRST_CODE

	const codeFor = (text: string | null): string | null => {
		if (text !== null && codes.has(text)) return codes.get(text) ?? null
		if (next > LAST_CODE) return null
		const code = String.fromCharCode(next++)
		if (text !== null) codes.set(text, code)
		return code
	}

	const spell = (texts: Array<string | null>) => {
		const chars = texts.map(codeFor)
		return chars.every((char) => char !== null) ? chars.join('') : null
	}

	const a = spell(current)
	const b = spell(incoming)
	return a === null || b === null ? null : [a, b]
}

/**
 * How the blocks of `incoming` line up against `current`, in order: blocks
 * whose text is unchanged are kept, and every run in between is replaced.
 *
 * `null` when the notes are too large to align, for the caller to fall back
 * to replacing everything.
 */
export function alignBlocks(
	current: Array<string | null>,
	incoming: string[]
): BlockAlignment[] | null {
	const encoded = encode(current, incoming)
	if (!encoded) return null

	const diffs = new DiffMatchPatch().diff_main(encoded[0], encoded[1], false)
	const alignment: BlockAlignment[] = []
	let i = 0
	let j = 0
	let pending: {
		current: [number, number]
		incoming: [number, number]
	} | null = null

	const flush = () => {
		if (pending) alignment.push({ kind: 'replace', ...pending })
		pending = null
	}

	for (const [operation, text] of diffs) {
		if (operation === DIFF_EQUAL) {
			flush()
			for (let k = 0; k < text.length; k++) {
				alignment.push({ kind: 'keep', current: i++, incoming: j++ })
			}
			continue
		}

		pending = pending ?? { current: [i, i], incoming: [j, j] }
		if (operation === DIFF_DELETE) {
			i += text.length
			pending.current[1] = i
		} else {
			j += text.length
			pending.incoming[1] = j
		}
	}
	flush()

	return alignment
}
