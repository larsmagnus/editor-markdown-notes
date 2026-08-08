import { useCurrentEditor } from '@tiptap/react'

/** Setting and clearing the colour of the selection. */
export function useEditorColor() {
	const { editor } = useCurrentEditor()

	const hasTextColor = (color: string) =>
		editor?.isActive('textStyle', { color }) ?? false

	const setTextColor = (color: string) => {
		editor?.chain().focus().setColor(color).run()
	}

	const resetTextColor = () => {
		editor?.chain().focus().unsetColor().run()
	}

	/** Picking the colour already applied clears it, so a swatch is a toggle. */
	const toggleTextColor = (color: string) => {
		if (hasTextColor(color)) return resetTextColor()

		return setTextColor(color)
	}

	return { hasTextColor, setTextColor, resetTextColor, toggleTextColor }
}
