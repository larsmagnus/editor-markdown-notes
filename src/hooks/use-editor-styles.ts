import { useCurrentEditor } from '@tiptap/react'

import {
	isListStyle,
	LIST_STYLE_COMMANDS,
} from '@/editor/commands/list-style-commands'
import type { ListStyle } from '@/editor/commands/list-style-commands'
import { TEXT_STYLE_COMMANDS } from '@/editor/commands/text-style-commands'
import type { TextStyle } from '@/editor/commands/text-style-commands'

export type Style = ListStyle | TextStyle

/** Lists are always applicable, so they need no `can()` round trip. */
function commandFor(style: Style) {
	return isListStyle(style)
		? { ...LIST_STYLE_COMMANDS[style], queryable: false }
		: TEXT_STYLE_COMMANDS[style]
}

/**
 * Applying and querying the editor's block and mark styles.
 *
 * `canToggleStyle` runs every style through `editor.can()`, so a query can no
 * longer mutate the document the way a hand-written per-style branch once did.
 */
export function useEditorStyles() {
	const { editor } = useCurrentEditor()

	const toggleStyle = (style: Style) => {
		if (!editor) return

		commandFor(style).apply(editor.chain().focus()).run()
	}

	const hasStyle = (style: Style) => {
		const { activeName } = commandFor(style)
		if (!activeName) return false

		return editor?.isActive(activeName) ?? false
	}

	const canToggleStyle = (style: Style) => {
		const { apply, queryable } = commandFor(style)
		if (!queryable) return true
		if (!editor) return false

		return apply(editor.can().chain().focus()).run()
	}

	const reset = () => toggleStyle('none')

	return { toggleStyle, hasStyle, canToggleStyle, reset }
}
