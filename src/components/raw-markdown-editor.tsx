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
export function RawMarkdownEditor({
	content,
	saveContent,
	className,
}: RawMarkdownEditorProps) {
	const { isVSCodeContext } = useSettings()
	const [draft, setDraft] = useState(content)

	const draftRef = useRef(draft)
	draftRef.current = draft

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const currentFile = useCallback(() => draftRef.current, [])
	const { queueSave } = useNoteSave({
		isVSCodeContext,
		saveContent,
		currentFile,
	})

	// Only while the caret is elsewhere. The host echoes every save back as an
	// `update`, and that echo is a debounce behind the keystrokes still arriving
	// - adopting it mid-edit would reset both the text and the caret.
	useEffect(() => {
		if (document.activeElement === textareaRef.current) return

		setDraft(content)
	}, [content])

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
			spellCheck={false}
			aria-label="Raw markdown"
			className={cn(
				'w-full resize-none border-none bg-transparent font-mono text-sm whitespace-pre outline-none',
				className
			)}
		/>
	)
}
