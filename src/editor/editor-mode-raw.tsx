import { cn } from 'cn'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useFlushOnDeactivate } from '#src/hooks/use-flush-on-deactivate'
import { useNoteSync } from '#src/hooks/use-note-sync'
import { useSettings } from '#src/hooks/use-settings'
import { findRawSearchRange } from '#src/lib/raw-search-reveal'
import { takeSearchReveal } from '#src/lib/search-reveal'

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
	const [draft, setDraft] = useState(content)

	const draftRef = useRef(draft)
	draftRef.current = draft

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// The text this view last agreed with the host about, from either direction:
	// what it took from `content`, or what it wrote back. A draft that still
	// matches it has nothing of the author's to lose.
	//
	// Both directions matter because `useHostDocument` applies each sync locally,
	// so `content` follows this view's own writes as well as outside edits -
	// tracking only what arrived would read an author who undid their way back
	// to the earlier text as having nothing pending.
	const adoptedRef = useRef(content)

	const currentFile = useCallback(() => draftRef.current, [])
	// This view's own echo check, parallel to `use-markdown-editor.ts`'s
	// `own-sync-tracker` rather than sharing it: `adoptedRef` already tells the
	// echo of this view's own write apart from an outside edit, and unlike the
	// live editor a stale match would only cost a redundant `setDraft` here,
	// not a document rebuild that drops keystrokes.
	const rememberSync = useCallback(
		(next: string) => {
			adoptedRef.current = next
			syncContent(next)
		},
		[syncContent]
	)
	const recordOwnSync = useCallback((next: string) => {
		adoptedRef.current = next
	}, [])
	const { queueSync, flushQueuedSync } = useNoteSync({
		isVSCodeContext,
		syncContent: rememberSync,
		currentFile,
		active,
		recordOwnSync,
	})
	useFlushOnDeactivate(active, flushQueuedSync)

	// Only while the caret is elsewhere. The host echoes every sync back as an
	// `update`, and that echo is a debounce behind the keystrokes still arriving
	// - adopting it mid-edit would reset both the text and the caret.
	useEffect(() => {
		if (document.activeElement === textareaRef.current) return

		adoptedRef.current = content
		setDraft(content)
	}, [content])

	// `content` will not change a second time, so the effect above never gets
	// another chance at a change that landed while the caret was here. Without
	// this the note shows text nobody wrote until it is closed and reopened.
	const handleBlur = () => {
		if (draftRef.current !== adoptedRef.current) return

		adoptedRef.current = content
		setDraft(content)
	}

	// A textarea can highlight nothing but its own selection, so selecting the
	// match *is* the highlight here - and focusing is what scrolls the container
	// to it. The usual "nothing may autofocus" rule is about not fighting the
	// remembered scroll position, which a reveal deliberately overrides anyway.
	const revealed = useRef(false)
	useEffect(() => {
		const textarea = textareaRef.current
		if (!textarea || revealed.current) return

		const reveal = takeSearchReveal()
		if (!reveal) return

		const range = findRawSearchRange(draftRef.current, reveal)
		if (!range) return

		revealed.current = true
		textarea.focus()
		textarea.setSelectionRange(range.start, range.end)
	}, [])

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setDraft(event.target.value)
		queueSync(event.target.value)
	}

	return (
		<textarea
			id={RAW_MARKDOWN_EDITOR_ID}
			ref={textareaRef}
			value={draft}
			onChange={handleChange}
			onBlur={handleBlur}
			spellCheck={false}
			aria-label="Raw markdown"
			className={cn(
				// `pre-wrap` rather than `pre`: the source shares the rendered
				// document's measure, so a line longer than it has to wrap rather
				// than run off the side of a column it cannot scroll.
				'w-full resize-none border-none bg-transparent font-mono text-sm whitespace-pre-wrap outline-none field-sizing-content',
				className
			)}
		/>
	)
}
