import type { ChangeEvent, KeyboardEvent } from 'react'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { parseImageMarkdown } from '@/editor/extensions/image/image-markdown-text'
import type { ImageAttrs } from '@/editor/extensions/image/image-markdown-text'
import { consumeImageSourceFocusRequest } from '@/editor/extensions/image/image-source-focus-request'
import { IMAGE_SOURCE_FIELD_ID } from '@/editor/extensions/image/keyboard-nav'

type ImageSourceFieldProps = {
	sourceText: string
	onCommit: (attrs: ImageAttrs) => void
}

/**
 * The revealed `![alt](src "title")` text itself, editable - a plain
 * controlled input rather than real document content (`image-view.tsx`
 * explains why an image has none to hold it in). Committing only happens on
 * blur or Enter, not per keystroke: `src`/`alt` mid-edit are rarely valid
 * image markdown, and re-parsing every character would flicker the `<img>`
 * between its old and new source.
 *
 * Mounting alone doesn't claim focus - a plain click on the image only
 * selects it, and stealing focus on every selection would blur the editor
 * immediately, hiding the bubble menu's "Edit source" button before it could
 * ever be clicked (its default `shouldShow` requires `view.hasFocus()`).
 * `consumeImageSourceFocusRequest` is the one exception: an ArrowRight/
 * ArrowLeft keydown about to land the caret on the image
 * (`use-image-selected.ts`) sets it before the selection change that mounts
 * this field even reaches React, since *that* entry is explicitly a caret
 * movement the user should land inside, at the edge they were headed toward.
 */
export function ImageSourceField({
	sourceText,
	onCommit,
}: ImageSourceFieldProps) {
	const [draft, setDraft] = useState(sourceText)

	// Following the image's own attrs, not the user's last keystroke - a
	// change from elsewhere (the "Edit image" popover, undo) must overwrite
	// whatever's mid-edit here, the same as any other controlled field.
	useEffect(() => {
		setDraft(sourceText)
	}, [sourceText])

	useEffect(() => {
		const edge = consumeImageSourceFocusRequest()
		if (!edge) return

		const field = document.getElementById(IMAGE_SOURCE_FIELD_ID)
		if (!(field instanceof HTMLInputElement)) return

		field.focus()
		const pos = edge === 'start' ? 0 : field.value.length
		field.setSelectionRange(pos, pos)
		field.scrollIntoView({ block: 'nearest' })
	}, [])

	const commit = () => {
		const parsed = parseImageMarkdown(draft)
		if (!parsed) {
			setDraft(sourceText)
			return
		}
		onCommit(parsed)
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setDraft(event.target.value)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault()
			commit()
		}
		if (event.key === 'Escape') {
			event.preventDefault()
			setDraft(sourceText)
		}
	}

	return (
		<span
			contentEditable={false}
			className="absolute top-full left-0 z-10 mt-1 w-max min-w-full"
		>
			<Input
				id={IMAGE_SOURCE_FIELD_ID}
				aria-label="Image source"
				value={draft}
				onChange={handleChange}
				onBlur={commit}
				onKeyDown={handleKeyDown}
				className="font-mono text-xs"
			/>
		</span>
	)
}
