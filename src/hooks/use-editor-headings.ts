import { useCurrentEditor } from '@tiptap/react'

import { parseHeadingLevel } from '@/editor/extensions/heading/heading-marker'
import type { HeadingLevel } from '@/lib/heading-levels'

/**
 * Applying and querying heading levels. `hasHeading` reads the current
 * block's own text rather than `editor.isActive('heading', {level})` -
 * `level` is no longer a node attribute (see `heading-extension.ts`), so
 * `isActive`'s attrs comparison would never match.
 */
export function useEditorHeadings() {
	const { editor } = useCurrentEditor()

	const toggleHeading = (level: HeadingLevel) => {
		editor?.chain().focus().toggleHeading({ level }).run()
	}

	const hasHeading = (level: HeadingLevel) => {
		if (!editor) return false
		const { $from } = editor.state.selection
		return (
			$from.parent.type.name === 'heading' &&
			parseHeadingLevel($from.parent.textContent) === level
		)
	}

	return { toggleHeading, hasHeading }
}
