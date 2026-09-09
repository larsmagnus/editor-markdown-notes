import { cn } from 'cn'
import { useRef } from 'react'

import { RawMarkdownHighlight } from '#src/editor/raw-markdown-highlight'
import { useRawDraftSync } from '#src/hooks/use-raw-draft-sync'
import { useRawSearchReveal } from '#src/hooks/use-raw-search-reveal'
import { useRawSyntaxHighlight } from '#src/hooks/use-raw-syntax-highlight'
import { useSettings } from '#src/hooks/use-settings'

interface RawMarkdownEditorProps {
	content: string
	syncContent: (content: string) => void
	/** Off while live mode is on screen instead - see `EditorBody`. Stays
	 *  mounted regardless, so an edit made here is still one undoable step on
	 *  the live editor once it is revealed again. */
	active?: boolean
	className?: string
}

/** Where the "Skip to editor" link (`skip-target.ts`) focuses in raw mode. */
export const RAW_MARKDOWN_EDITOR_ID = 'raw-markdown-editor'

/**
 * The note as plain markdown source, editable and autosyncing.
 *
 * Writes the file verbatim - frontmatter included - because this view shows the
 * whole file. The rich editor keeps frontmatter as its own node and reads it
 * out through `splitFrontmatter`, which would re-fence a block that is already
 * fenced here.
 */
export function EditorModeRaw({
	content,
	syncContent,
	active = true,
	className,
}: RawMarkdownEditorProps) {
	const { isVSCodeContext } = useSettings()
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const { draft, draftRef, handleChange, handleBlur } = useRawDraftSync({
		content,
		syncContent,
		active,
		isVSCodeContext,
		textareaRef,
	})
	useRawSearchReveal(textareaRef, draftRef)
	const tokens = useRawSyntaxHighlight(draft, active)

	return (
		// The measure/centering classes (`className`) live on this wrapper, not
		// the textarea - `RawMarkdownHighlight` shares this same box via
		// `absolute inset-0`, and the two must wrap at the identical width or a
		// click lands on whatever character the textarea's own, differently
		// wrapped layout puts underneath it, not the one the mirror shows there.
		<div className={cn('relative', className)}>
			<RawMarkdownHighlight text={draft} tokens={tokens} />
			<textarea
				id={RAW_MARKDOWN_EDITOR_ID}
				ref={textareaRef}
				value={draft}
				onChange={handleChange}
				onBlur={handleBlur}
				spellCheck={false}
				aria-label="Raw markdown"
				// `pre-wrap` rather than `pre`: the source shares the rendered
				// document's measure, so a line longer than it has to wrap rather
				// than run off the side of a column it cannot scroll.
				//
				// Text itself is transparent - `RawMarkdownHighlight` behind it
				// carries the actual colored glyphs - but the caret stays the
				// theme's foreground color so it doesn't vanish along with it.
				className="relative w-full resize-none border-none bg-transparent font-mono text-sm whitespace-pre-wrap text-transparent caret-foreground outline-none field-sizing-content"
			/>
		</div>
	)
}
