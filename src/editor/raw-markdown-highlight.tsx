import { buildHighlightSegments } from '#src/lib/raw-markdown-highlight-segments'
import type { RelativeToken } from '#src/lib/syntax-highlight-tokens'

interface RawMarkdownHighlightProps {
	text: string
	tokens: RelativeToken[]
}

/**
 * The colored mirror stacked behind raw mode's textarea - Shiki's tokens
 * drawn as a `<pre>` of colored spans, matching the textarea's own box
 * exactly so the two stay pixel-aligned. `EditorModeRaw` makes the textarea's
 * own text transparent so this shows through it.
 */
export function RawMarkdownHighlight({
	text,
	tokens,
}: RawMarkdownHighlightProps) {
	const segments = buildHighlightSegments(text, tokens)

	return (
		<pre
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 m-0 w-full resize-none overflow-hidden border-none bg-transparent font-mono text-sm whitespace-pre-wrap"
		>
			{segments.map((segment, index) => (
				// eslint-disable-next-line react/no-array-index-key -- segments are
				// recomputed wholesale each pass, so index is a stable-enough key.
				<span key={index} style={segment.style}>
					{segment.text}
				</span>
			))}
		</pre>
	)
}
