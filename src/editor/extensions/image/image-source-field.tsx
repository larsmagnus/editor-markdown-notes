import { CornerDownLeft } from 'lucide-react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useEffect, useState } from 'react'

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group'
import { parseImageMarkdown } from '@/editor/extensions/image/image-markdown-text'
import type { ImageAttrs } from '@/editor/extensions/image/image-markdown-text'
import {
	consumeImageSourceEntryEdge,
	IMAGE_SOURCE_FIELD_ID,
} from '@/editor/extensions/image/keyboard-nav'

type ImageSourceFieldProps = {
	sourceText: string
	/** `null` where the field was cleared, meaning the image itself should go. */
	onCommit: (attrs: ImageAttrs | null) => void
}

/**
 * The revealed `![alt](src "title")` text, editable - a controlled input
 * rather than real document content, an image having none to hold it in.
 * Committing on submit or blur rather than per keystroke: a mid-edit `src` is
 * rarely valid image markdown, and re-parsing every character would flicker
 * the `<img>` between its old and new source.
 *
 * An empty field deletes the image. This is the only editable form the image
 * has, so restoring the old text there - which is what every repair pass in
 * the editor used to do with syntax it found missing - would leave no way to
 * remove an image by editing it. Text that is merely unparseable is a
 * half-typed source, not a request to delete anything, and reverts.
 *
 * Mounting alone does not claim focus. A click on the image only selects it,
 * and stealing focus would blur the editor, hiding the bubble menu's "Edit
 * source" button before it could be clicked. Arrow-key entry is the exception,
 * being explicitly a caret movement that should land inside - which edge it
 * lands on comes from `consumeImageSourceEntryEdge`.
 */
export function ImageSourceField({
	sourceText,
	onCommit,
}: ImageSourceFieldProps) {
	const [draft, setDraft] = useState(sourceText)

	// Follows the image's own attrs: a change from the popover or an undo must
	// overwrite whatever is mid-edit here, as in any controlled field.
	useEffect(() => {
		setDraft(sourceText)
	}, [sourceText])

	useEffect(() => {
		const edge = consumeImageSourceEntryEdge()
		if (!edge) return

		const field = document.getElementById(IMAGE_SOURCE_FIELD_ID)
		if (!(field instanceof HTMLInputElement)) return

		field.focus()
		const pos = edge === 'start' ? 0 : field.value.length
		field.setSelectionRange(pos, pos)
		field.scrollIntoView({ block: 'nearest' })
	}, [])

	const commit = () => {
		if (draft.trim() === '') {
			onCommit(null)
			return
		}

		const parsed = parseImageMarkdown(draft)
		if (!parsed) {
			setDraft(sourceText)
			return
		}
		onCommit(parsed)
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		commit()
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		setDraft(event.target.value)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape') {
			event.preventDefault()
			setDraft(sourceText)
		}
	}

	return (
		<span contentEditable={false} className="mb-1 block w-full">
			<form onSubmit={handleSubmit}>
				<InputGroup>
					<InputGroupInput
						id={IMAGE_SOURCE_FIELD_ID}
						aria-label="Image source"
						value={draft}
						onChange={handleChange}
						onBlur={commit}
						onKeyDown={handleKeyDown}
						className="font-mono text-xs scroll-mt-18"
					/>
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							type="submit"
							size="sm"
							className="ml-auto"
							// Keeps the field's own `onBlur` from committing first, which
							// would submit whatever the blur decided rather than the draft.
							onMouseDown={(event) => event.preventDefault()}
						>
							<CornerDownLeft />
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>
		</span>
	)
}
