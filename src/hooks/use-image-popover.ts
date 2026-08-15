import { useCurrentEditor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

import { useEditorImage } from '@/hooks/use-editor-image'

/**
 * `ImagePopover`'s open state, plus two behaviors layered on top of a plain
 * controlled popover: opening itself immediately when the selected image has
 * no src yet, and deleting that image again if the popover closes without
 * ever giving it one.
 *
 * The slash command's "image" action inserts an empty, selected image node
 * outside VS Code, where there is no file dialog to fill it in first - so
 * the auto-open is the form the user actually sees, rather than what would
 * otherwise look like nothing happening at all, and the auto-delete on
 * cancel keeps a dismissed empty image from being saved as a broken `![]()`.
 *
 * Auto-delete is gated on a ref rather than "is the Src field blank right
 * now": opening the popover manually over an *existing* image (the toolbar's
 * edit button) and clearing the field to retype it must never delete that
 * live image if the user cancels instead of finishing.
 */
export function useImagePopover() {
	const { editor } = useCurrentEditor()
	const { src, setSrc, alt, setAlt, selectedImage, updateImage, deleteImage } =
		useEditorImage()
	const [open, setOpen] = useState(false)
	const deleteOnCancelRef = useRef(false)
	// The position last checked for auto-open, so moving the selection from one
	// image straight to another (Tab, `moveToAdjacentImage`) re-checks the new
	// one - the popover stays mounted across that move, so a plain mount effect
	// would only ever see the first image.
	const checkedPosRef = useRef<number | null>(null)

	const openPopover = (image: { src: string; alt: string }) => {
		setSrc(image.src)
		setAlt(image.alt)
		setOpen(true)
	}

	const openWithCurrentImage = () => {
		deleteOnCancelRef.current = false
		openPopover(selectedImage())
	}

	useEffect(() => {
		if (!editor) return

		const maybeAutoOpen = () => {
			if (!editor.isActive('image')) return

			const pos = editor.state.selection.from
			if (checkedPosRef.current === pos) return
			checkedPosRef.current = pos

			const current = selectedImage()
			if (current.src !== '') return

			deleteOnCancelRef.current = true
			openPopover(current)
		}

		maybeAutoOpen()
		editor.on('selectionUpdate', maybeAutoOpen)

		return () => {
			editor.off('selectionUpdate', maybeAutoOpen)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor])

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen)
		if (!nextOpen && deleteOnCancelRef.current && selectedImage().src === '') {
			deleteImage()
		}
	}

	const apply = () => {
		deleteOnCancelRef.current = false
		updateImage(() => setOpen(false))
	}

	return {
		src,
		setSrc,
		alt,
		setAlt,
		open,
		openWithCurrentImage,
		handleOpenChange,
		apply,
	}
}
