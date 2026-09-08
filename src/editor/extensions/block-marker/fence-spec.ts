import type { BlockMarkerSpec } from '#src/editor/extensions/block-marker/spec'
import { unwrapFenced } from '#src/editor/extensions/block-marker/unwrap'

/** The subset of a fence parse every fenced construct's marker handling needs. */
export type FenceRange = {
	/** Character offset where the content starts, after the opening fence line. */
	codeFrom: number
	/** Character offset where the content ends, before the closing fence line. */
	codeTo: number
	hasClosingFence: boolean
}

type FenceMarkerOptions = {
	nodeTypes: string[]
	parse: (text: string) => FenceRange
	/** The character a fence repeats - a backtick, or a dash for frontmatter. */
	fenceChar: string
	/**
	 * Write a fence for a construct that has none. True for code blocks, which
	 * arrive unfenced from a paste or a toolbar toggle. False for frontmatter,
	 * whose only creator already builds both fences: there, a missing fence
	 * means the block is genuinely malformed, and repairing it silently would
	 * move the author's text inside the YAML instead of showing the error.
	 */
	seed: boolean
}

/**
 * A fenced construct as a block marker, its opening fence line the leading
 * marker and its closing fence the trailing one - the shape `codeBlock` and
 * `frontmatter` share, each bringing its own parser since the fence text
 * differs (backticks and a language tag vs. a bare `---`).
 *
 * Both fences resolve to whatever is already there, so the language tag and
 * the exact backtick count stay the author's. The empty-content case is the
 * only one where a seeded pair needs care: the opening fence already ends in
 * the newline the closing one would otherwise add, so an originally-empty
 * block round-trips to the same bytes rather than growing a blank line.
 */
export function createFenceMarkerSpec({
	nodeTypes,
	parse,
	fenceChar,
	seed,
}: FenceMarkerOptions): BlockMarkerSpec {
	const fence = fenceChar.repeat(3)
	const trailingLength = (text: string) => {
		const { codeTo, hasClosingFence } = parse(text)
		return hasClosingFence ? text.length - codeTo : 0
	}

	return {
		nodeTypes,
		markerHost: 'self',
		revealScope: 'node',
		length: (text) => parse(text).codeFrom,
		trailingLength,
		resolve: ({ text }) => {
			const { codeFrom } = parse(text)
			if (codeFrom > 0) return text.slice(0, codeFrom)
			return seed ? `${fence}\n` : ''
		},
		resolveTrailing: seed
			? ({ text }) => {
					const { codeFrom, codeTo } = parse(text)
					if (trailingLength(text) > 0) return text.slice(codeTo)
					return text.slice(codeFrom, codeTo) ? `\n${fence}` : fence
				}
			: undefined,
		demote: () => null,
		unwrap: unwrapFenced(fenceChar),
	}
}
