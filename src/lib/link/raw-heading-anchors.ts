import { headingDisplayText } from '#src/lib/link/heading-display-text'
import { slugifyHeadings } from '#src/lib/link/slugify-headings'

const ATX_HEADING = /^#{1,6}[ \t]+\S.*$/
const FENCE = /^(```|~~~)/

export type RawHeadingAnchor = {
	hash: string
	/** Character offset into the source where the heading's line starts. */
	offset: number
}

/**
 * Every ATX heading in raw markdown source, with the slug a link's `#hash`
 * would target and the offset raw mode's textarea should jump to.
 *
 * A per-line regex scan, not a markdown-it parse - raw mode has no parsed
 * document to walk, only the source text a Cmd/Ctrl+click lands in. Tracks
 * fence state so a `#` inside a fenced code block is never read as a heading.
 */
export function findRawHeadingAnchors(source: string): RawHeadingAnchor[] {
	const lines = source.split('\n')
	const headingLines: { text: string; offset: number }[] = []

	let inFence = false
	let offset = 0
	for (const line of lines) {
		if (FENCE.test(line.trim())) {
			inFence = !inFence
		} else if (!inFence && ATX_HEADING.test(line)) {
			headingLines.push({ text: line, offset })
		}

		offset += line.length + 1
	}

	const slugs = slugifyHeadings(
		headingLines.map(({ text }) => headingDisplayText(text))
	)

	return headingLines.map(({ offset: lineOffset }, index) => ({
		hash: slugs[index],
		offset: lineOffset,
	}))
}
