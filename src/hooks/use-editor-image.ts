import { useCurrentEditor } from '@tiptap/react'
import { useState } from 'react'

/**
 * The image popover's state and commands.
 *
 * `src`/`alt` are held here rather than in the popover so that opening it
 * over an existing image can seed the fields from `selectedImage`.
 */
export function useEditorImage() {
	const { editor } = useCurrentEditor()
	const [src, setSrc] = useState('')
	const [alt, setAlt] = useState('')

	const selectedImage = (): { src: string; alt: string } => {
		const attrs = editor?.getAttributes('image') ?? {}
		return { src: attrs.src ?? '', alt: attrs.alt ?? '' }
	}

	const updateImage = (onDone?: () => void) => {
		if (src.trim() === '') return

		editor?.chain().focus().updateAttributes('image', { src, alt }).run()
		onDone?.()
	}

	const deleteImage = () => {
		editor?.chain().focus().deleteSelection().run()
	}

	return { src, setSrc, alt, setAlt, selectedImage, updateImage, deleteImage }
}
