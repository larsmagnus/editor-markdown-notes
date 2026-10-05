import type { PhrasingContent } from 'mdast'

import { ADMONITION_TAG_PATTERN } from '#src/lib/admonition-tag'

/** Blockquote prefix that opens each continuation line of a quoted paragraph. */
const QUOTE_PREFIX = /^ {0,3}(?:> ?)+/

/**
 * The inline children of an admonition's first paragraph with the `[!TYPE]`
 * line removed, or `null` when the paragraph does not open with one. The
 * mdast counterpart of skipping the tag's own paragraph in `document-text.ts`:
 * markdown-it splits that line into its own paragraph, micromark leaves it in
 * the same one as the body, and both must hand retext the same prose.
 *
 * `body` is the source the nodes' offsets index into, needed to move the
 * trimmed text's start past the newline and the next line's `> `.
 */
export function withoutAdmonitionTag(
	children: readonly PhrasingContent[],
	body: string
): PhrasingContent[] | null {
	const [first, ...rest] = children
	if (first?.type !== 'text') return null

	const newline = first.value.indexOf('\n')
	const tagLine = newline === -1 ? first.value : first.value.slice(0, newline)
	if (!ADMONITION_TAG_PATTERN.test(tagLine.trim())) return null
	if (newline === -1) return rest

	const remainder = first.value.slice(newline + 1)
	const start = first.position?.start
	const end = first.position?.end
	if (!remainder || !start || start.offset === undefined || !end) return rest

	const raw = body.slice(start.offset, end.offset)
	const rawNewline = raw.indexOf('\n')
	const prefix = QUOTE_PREFIX.exec(raw.slice(rawNewline + 1))?.[0].length ?? 0
	const skipped = rawNewline + 1 + prefix

	return [
		{
			...first,
			value: remainder,
			position: {
				start: { ...start, offset: start.offset + skipped },
				end,
			},
		},
		...rest,
	]
}
