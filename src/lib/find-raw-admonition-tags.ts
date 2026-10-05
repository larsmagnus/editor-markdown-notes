import {
	ADMONITION_TAG_PATTERN,
	parseAdmonitionType,
} from '#src/lib/admonition-tag'
import type { AdmonitionType } from '#src/lib/admonition-tag'

type RawAdmonitionTag = { from: number; to: number; type: AdmonitionType }

const TAG_LINE = /^[ \t]*>[ \t]*(\[![a-z]+\])[ \t]*\r?$/i
const FENCE_LINE = /^ {0,3}(```|~~~)/

/**
 * Every `> [!TYPE]` line in raw markdown source and the range its `[!TYPE]`
 * occupies, for coloring it as the type it declares. Lines inside a fenced
 * code block are skipped: there the text is code, not an alert.
 */
export function findRawAdmonitionTags(source: string): RawAdmonitionTag[] {
	const tags: RawAdmonitionTag[] = []
	let fence: string | null = null
	let lineStart = 0

	for (const line of source.split('\n')) {
		const marker = FENCE_LINE.exec(line)?.[1]
		if (marker && fence === null) fence = marker
		else if (marker && marker === fence) fence = null
		else if (fence === null) {
			const tag = TAG_LINE.exec(line)?.[1]
			const type = tag ? parseAdmonitionType(tag.slice(2, -1)) : null
			if (tag && type && ADMONITION_TAG_PATTERN.test(tag)) {
				const from = lineStart + line.indexOf(tag)
				tags.push({ from, to: from + tag.length, type })
			}
		}
		lineStart += line.length + 1
	}

	return tags
}
