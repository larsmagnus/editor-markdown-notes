import type { CSSProperties } from 'react'

/** One Shiki token's color/style, independent of where it is placed. */
export type StyledToken = {
	color: string
	/** Shiki's TextMate `FontStyle` bitmask: 1 italic, 2 bold, 4 underline, 8
	 *  strikethrough. Its `NotSet` is `-1`, which has every one of those bits
	 *  set, so it has to be filtered out rather than masked. */
	fontStyle?: number
}

function fontStyleFlags(fontStyle: number | undefined) {
	if (!fontStyle || fontStyle < 0) {
		return {
			italic: false,
			bold: false,
			underline: false,
			strikethrough: false,
		}
	}

	return {
		italic: Boolean(fontStyle & 1),
		bold: Boolean(fontStyle & 2),
		underline: Boolean(fontStyle & 4),
		strikethrough: Boolean(fontStyle & 8),
	}
}

/** A token's color/style as an inline CSS declaration string, for
 *  ProseMirror's `Decoration.inline`, which takes DOM attributes directly. */
export function styleFor(token: StyledToken): string {
	const { italic, bold, underline, strikethrough } = fontStyleFlags(
		token.fontStyle
	)

	let style = `color:${token.color}`
	if (italic) style += ';font-style:italic'
	if (bold) style += ';font-weight:bold'
	if (underline) style += ';text-decoration:underline'
	if (strikethrough) style += ';text-decoration:line-through'

	return style
}

/** A token's color/style as a React `CSSProperties` object, for a component
 *  rendering it through the `style` prop rather than a raw DOM attribute. */
export function styleObjectFor(token: StyledToken): CSSProperties {
	const { italic, bold, underline, strikethrough } = fontStyleFlags(
		token.fontStyle
	)

	const decoration = [underline && 'underline', strikethrough && 'line-through']
		.filter(Boolean)
		.join(' ')

	return {
		color: token.color,
		fontStyle: italic ? 'italic' : undefined,
		fontWeight: bold ? 'bold' : undefined,
		textDecoration: decoration || undefined,
	}
}
