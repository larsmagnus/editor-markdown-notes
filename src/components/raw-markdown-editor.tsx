import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useNoteSave } from '@/hooks/use-note-save'
import { useSettings } from '@/hooks/use-settings'
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
 * whole file. The rich editor's `splitFrontmatter`/`joinFrontmatter` round trip
 * would re-fence a block that is already fenced here.
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
