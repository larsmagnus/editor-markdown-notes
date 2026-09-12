import { cn } from 'cn'
import { useEffect, useRef } from 'react'

import { RawMarkdownHighlight } from '#src/editor/raw-markdown-highlight'
import type { AnalyzerHandle } from '#src/hooks/use-analyzer'
import { useRawDraftSync } from '#src/hooks/use-raw-draft-sync'
import { useRawHeadingReveal } from '#src/hooks/use-raw-heading-reveal'
import { useRawLinkClick } from '#src/hooks/use-raw-link-click'
import { useRawLinkHover } from '#src/hooks/use-raw-link-hover'
import { useRawSearchReveal } from '#src/hooks/use-raw-search-reveal'
import { useRawSyntaxHighlight } from '#src/hooks/use-raw-syntax-highlight'
import { useRawTextTools } from '#src/hooks/use-raw-text-tools'
import { useSettings } from '#src/hooks/use-settings'
import type { SourcePlacedIssue } from '#src/lib/text-tools/place-source-issues'

interface RawMarkdownEditorProps {
	content: string
	syncContent: (content: string) => void
	/** Off while live mode is on screen instead - see `EditorBody`. Stays
	 *  mounted regardless, so an edit made here is still one undoable step on
	 *  the live editor once it is revealed again. */
	active?: boolean
	className?: string
	/** One analyzer shared with the live editor, owned by `EditorBody`. Falls
	 *  back to one owned here when absent, for a standalone mount with no
	 *  `EditorBody` around it. */
	analyzer?: AnalyzerHandle
	/** Reports the current placed issues to `EditorBody`, which hands them to
	 *  the sidebar (`RawTextToolsContext`) so a click can select inside this
	 *  textarea while it is the visible mode. */
	onIssuesChange?: (issues: SourcePlacedIssue[]) => void
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
	analyzer,
	onIssuesChange,
}: RawMarkdownEditorProps) {
	const { isVSCodeContext } = useSettings()
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const overlayRef = useRef<HTMLPreElement>(null)

	const { draft, draftRef, handleChange, handleBlur } = useRawDraftSync({
		content,
		syncContent,
		active,
		isVSCodeContext,
		textareaRef,
	})
	useRawSearchReveal(textareaRef, draftRef)
	useRawHeadingReveal(textareaRef, draftRef, active)
	useRawLinkClick(textareaRef, draftRef)
	const activeLinkRangeIndex = useRawLinkHover(textareaRef, overlayRef)
	const tokens = useRawSyntaxHighlight(draft, active)
	const issues = useRawTextTools(draft, active, analyzer)

	useEffect(() => {
		onIssuesChange?.(issues)
	}, [issues, onIssuesChange])

	return (
		// The measure/centering classes (`className`) live on this wrapper, not
		// the textarea - `RawMarkdownHighlight` shares this same box via
		// `absolute inset-0`, and the two must wrap at the identical width or a
		// click lands on whatever character the textarea's own, differently
		// wrapped layout puts underneath it, not the one the mirror shows there.
		<div className={cn('relative', className)}>
			<RawMarkdownHighlight
				ref={overlayRef}
				text={draft}
				tokens={tokens}
				activeLinkRangeIndex={activeLinkRangeIndex}
				issues={issues}
			/>
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
				//
				// `cursor-pointer` while `useRawLinkHover` reports the mouse over a
				// link's href with the modifier held - the textarea is what actually
				// receives the pointer, so it is the one CSS can style a cursor on.
				className={cn(
					'relative w-full resize-none border-none bg-transparent font-mono text-sm whitespace-pre-wrap text-transparent caret-foreground outline-none field-sizing-content',
					activeLinkRangeIndex !== null && 'cursor-pointer'
				)}
			/>
		</div>
	)
}
