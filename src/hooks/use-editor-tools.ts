import { useCurrentEditor } from '@tiptap/react'
import { useState } from 'react'

type TextStyle =
	| 'italic'
	| 'bold'
	| 'strike'
	| 'code'
	| 'codeBlock'
	| 'blockquote'
	| 'paragraph'
	| 'none'
type ListStyle = 'ordered' | 'unordered' | 'none'
export type Style = ListStyle | TextStyle
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export function useEditorTools() {
	const { editor } = useCurrentEditor()
	const [url, setUrl] = useState('/')

	// Fetch the currently selected link, if any
	const getSelectedLink = () => {
		//if (!editor) return ''
		const { href } = editor?.getAttributes('link') || {}
		return href ?? ''
	}

	const getSelectedText = () => {
		//if (!editor) return ''

		const { state } = editor || {}
		const { from = 0, to = 0 } = state?.selection || {}

		const text = state?.doc.textBetween(from, to, ' ')

		return text ?? ''
	}

	// Set link for selected text
	const setLink = (callback?: () => void) => {
		if (url.trim() === '') return
		editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
		callback?.()
	}

	// Unset link for selected text
	const unsetLink = (callback?: () => void) => {
		editor?.chain().focus().unsetLink().run()
		setUrl('/')
		callback?.()
	}

	// resets styles and formatting
	const reset = () =>
		editor
			?.chain()
			.focus()
			// Remove colors
			.unsetColor()
			// Remove styles (bold, italic etc)
			.unsetAllMarks()
			// Remove heading level
			.setParagraph()
			.run()

	const toggleBold = () => editor?.chain().focus().toggleBold().run()
	const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
	const toggleStrikeThrough = () => editor?.chain().focus().toggleStrike().run()
	const toggleCode = () => editor?.chain().focus().toggleCode().run()
	const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run()
	const toggleBlockQuote = () =>
		editor?.chain().focus().toggleBlockquote().run()
	const toggleParagraph = () => editor?.chain().focus().setParagraph().run()

	const toggleTextStyle = (style: TextStyle) => {
		switch (style) {
			case 'bold': {
				return toggleBold()
			}
			case 'italic': {
				return toggleItalic()
			}
			case 'strike': {
				return toggleStrikeThrough()
			}
			case 'code': {
				return toggleCode()
			}
			case 'codeBlock': {
				return toggleCodeBlock()
			}
			case 'blockquote': {
				return toggleBlockQuote()
			}
			case 'paragraph': {
				return toggleParagraph()
			}
			case 'none': {
				return reset()
			}
		}
	}

	const hasTextStyle = (style: TextStyle) => {
		return editor?.isActive(style) ?? false
	}

	const canToggleTextStyle = (
		style: Omit<TextStyle, 'paragraph' | 'codeBlock' | 'none'>
	) => {
		switch (style) {
			case 'bold': {
				return editor?.can().chain().focus().toggleBold().run() ?? false
			}
			case 'italic': {
				return editor?.can().chain().focus().toggleItalic().run() ?? false
			}
			case 'strike': {
				return editor?.can().chain().focus().toggleStrike().run() ?? false
			}
			case 'code': {
				return editor?.can().chain().focus().toggleCode().run() ?? false
			}
			case 'blockquote': {
				return editor?.chain().focus().toggleBlockquote().run() ?? false
			}
		}
	}

	const hasTextColor = (hexColor: string) =>
		editor?.isActive('textStyle', { color: hexColor }) ?? false

	const setTextColor = (hexColor: string) =>
		editor?.chain().focus().setColor(hexColor).run()
	const resetTextColor = () =>
		editor
			?.chain()
			.focus()
			// Remove colors
			.unsetColor()
			.run()

	const toggleTextColor = (hexColor: string) => {
		const hasCurrentColor = hasTextColor(hexColor)

		if (hasCurrentColor) {
			return resetTextColor()
		}
		return setTextColor(hexColor)
	}

	const toggleOrderedList = () =>
		editor?.chain().focus().toggleOrderedList().run()
	const toggleUnorderedList = () =>
		editor?.chain().focus().toggleBulletList().run()

	const hasListStyle = (style: ListStyle) => {
		switch (style) {
			case 'ordered': {
				return editor?.isActive('orderedList') ?? false
			}
			case 'unordered': {
				return editor?.isActive('bulletList') ?? false
			}
		}
	}

	const isListStyle = (style: string): style is ListStyle => {
		const isListStyle = ['ordered', 'unordered'].includes(style)
		return isListStyle
	}

	const toggleListStyle = (style: ListStyle) => {
		switch (style) {
			case 'ordered': {
				return toggleOrderedList()
			}
			case 'unordered': {
				return toggleUnorderedList()
			}
			case 'none': {
				return reset()
			}
		}
	}

	const toggleHeadingByLevel = (headingLevel: HeadingLevel) =>
		editor?.chain().focus().toggleHeading({ level: headingLevel }).run()

	const hasHeadingLevel = (headingLevel: HeadingLevel) =>
		editor?.isActive('heading', { level: headingLevel }) ?? false

	const undo = () => editor?.chain().focus().undo().run()
	const canUndo = () => editor?.can().chain().focus().undo().run() ?? false
	const redo = () => editor?.chain().focus().redo().run()
	const canRedo = () => editor?.can().chain().focus().redo().run() ?? false

	const toggleStyle = (style: Style) => {
		if (isListStyle(style)) {
			return toggleListStyle(style)
		}

		return toggleTextStyle(style)
	}

	const hasStyle = (style: Style) => {
		if (isListStyle(style)) {
			return hasListStyle(style)
		}

		return hasTextStyle(style)
	}

	const canToggleStyle = (style: Style) => {
		if (isListStyle(style)) {
			return true
		}

		return canToggleTextStyle(style)
	}

	return {
		editor,
		undo,
		canUndo,
		redo,
		canRedo,
		reset,
		toggleStyle,
		hasStyle,
		canToggleStyle,
		setTextColor,
		resetTextColor,
		hasTextColor,
		toggleTextColor,
		toggleTextStyle,
		canToggleTextStyle,
		hasTextStyle,
		toggleListStyle,
		toggleHeadingByLevel,
		hasHeadingLevel,
		toggleOrderedList,
		hasListStyle,
		getSelectedLink,
		getSelectedText,
		setLink,
		unsetLink,
		toggleBold,
		setUrl,
		url,
	}
}
