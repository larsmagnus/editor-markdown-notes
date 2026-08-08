import { useCurrentEditor } from '@tiptap/react'

import type { HeadingLevel } from '@/lib/heading-levels'

/** Applying and querying heading levels. */
export function useEditorHeadings() {
	const { editor } = useCurrentEditor()

	const toggleHeading = (level: HeadingLevel) => {
		editor?.chain().focus().toggleHeading({ level }).run()
	}

	const hasHeading = (level: HeadingLevel) =>
		editor?.isActive('heading', { level }) ?? false

	return { toggleHeading, hasHeading }
}
