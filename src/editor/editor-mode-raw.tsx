import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useNoteSave } from '@/hooks/use-note-save'
import { useSettings } from '@/hooks/use-settings'
import { findRawSearchRange } from '@/lib/raw-search-reveal'
import { takeSearchReveal } from '@/lib/search-reveal'
import { cn } from '@/lib/utils'

interface RawMarkdownEditorProps {
	content: string
	saveContent: (content: string) => void
	className?: string
}

/**
 * The note as plain markdown source, editable and autosaving.
 *
 * Writes the file verbatim - frontmatter included - because this view shows the
 * whole file. The rich editor keeps frontmatter as its own node and reads it
 * out through `splitFrontmatter`, which would re-fence a block that is already
 * fenced here.
 */
export function EditorModeRaw({
	content,
	saveContent,
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
	// Both directions matter because `useHostDocument` applies each save locally,
	// so `content` follows this view's own writes as well as outside edits -
	// tracking only what arrived would read an author who undid their way back
	// to the earlier text as having nothing pending.
	const adoptedRef = useRef(content)

	const currentFile = useCallback(() => draftRef.current, [])
	const rememberSave = useCallback(
		(next: string) => {
			adoptedRef.current = next
			saveContent(next)
		},
		[saveContent]
	)
	const { queueSave } = useNoteSave({
		isVSCodeContext,
		saveContent: rememberSave,
		currentFile,
	})

	// Only while the caret is elsewhere. The host echoes every save back as an
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
		queueSave(event.target.value)
	}

	return (
		<textarea
			ref={textareaRef}
			value={draft}
			onChange={handleChange}
			onBlur={handleBlur}
			spellCheck={false}
			aria-label="Raw markdown"
			className={cn(
				'w-full resize-none border-none bg-transparent font-mono text-sm whitespace-pre outline-none field-sizing-content',
				className
			)}
		/>
	)
}
