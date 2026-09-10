import type { Ref } from 'react'
import { useMemo } from 'react'

import { findRawLinkRanges } from '#src/editor/extensions/link/find-raw-link-ranges'
import { buildHighlightSegments } from '#src/lib/raw-markdown-highlight-segments'
import type { RelativeToken } from '#src/lib/syntax-highlight-tokens'

interface RawMarkdownHighlightProps {
	text: string
	tokens: RelativeToken[]
	/** The link whose parens content the mouse currently sits over with
	 *  Cmd/Ctrl held (`use-raw-link-hover.ts`), or `null` for none - the one
	 *  segment this underlines. */
	activeLinkRangeIndex: number | null
	ref?: Ref<HTMLPreElement>
}

/**
 * The colored mirror stacked behind raw mode's textarea - Shiki's tokens
 * drawn as a `<pre>` of colored spans, matching the textarea's own box
 * exactly so the two stay pixel-aligned. `EditorModeRaw` makes the textarea's
 * own text transparent so this shows through it.
 *
 * Every link's parens content also gets a `data-link-range` span, whether or
 * not it falls inside a Shiki token - `use-raw-link-hover.ts` (which owns
 * `activeLinkRangeIndex`) queries these by that attribute to hover-test the
 * mouse against their rendered rects, since this layer's own
 * `pointer-events-none` makes it invisible to the DOM's own hit-testing.
 */
export function RawMarkdownHighlight({
	text,
	tokens,
	activeLinkRangeIndex,
	ref,
}: RawMarkdownHighlightProps) {
	const linkRanges = useMemo(() => findRawLinkRanges(text), [text])
	const segments = useMemo(
		() => buildHighlightSegments(text, tokens, linkRanges),
		[text, tokens, linkRanges]
	)

	return (
		<pre
			ref={ref}
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 m-0 w-full resize-none overflow-hidden border-none bg-transparent font-mono text-sm whitespace-pre-wrap"
		>
			{segments.map((segment, index) => (
				<span
					// eslint-disable-next-line react/no-array-index-key -- segments are
					// recomputed wholesale each pass, so index is a stable-enough key.
					key={index}
					data-link-range={segment.linkRangeIndex}
					style={
						segment.linkRangeIndex === activeLinkRangeIndex
							? { ...segment.style, textDecoration: 'underline' }
							: segment.style
					}
				>
					{segment.text}
				</span>
			))}
		</pre>
	)
}
