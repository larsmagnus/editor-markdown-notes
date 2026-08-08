import { useCurrentEditor } from '@tiptap/react'
import { useState } from 'react'

const EMPTY_URL = '/'

/**
 * The link popover's state and commands.
 *
 * `url` is held here rather than in the popover so that opening it over an
 * existing link can seed the field from `selectedLink`.
 */
export function useEditorLink() {
	const { editor } = useCurrentEditor()
	const [url, setUrl] = useState(EMPTY_URL)

	const selectedLink = (): string => editor?.getAttributes('link').href ?? ''

	const isLinkActive = () => editor?.isActive('link') ?? false

	const setLink = (onDone?: () => void) => {
		if (url.trim() === '') return

		editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
		onDone?.()
	}

	const unsetLink = (onDone?: () => void) => {
		editor?.chain().focus().unsetLink().run()
		setUrl(EMPTY_URL)
		onDone?.()
	}

	return { url, setUrl, selectedLink, isLinkActive, setLink, unsetLink }
}
