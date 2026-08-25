import { starPasteRegex, underscorePasteRegex } from '@tiptap/extension-italic'
import { markPasteRule } from '@tiptap/react'
import type { MarkType } from 'prosemirror-model'

/**
 * The two ways markdown spells italic and each one's paste regex. Input
 * rules are handled separately, by `createDelimiterInputRule` in
 * `italic-extension.ts` - unlike paste, they need to leave real delimiter
 * text behind rather than consuming it into a bare mark.
 */
const MARKUP_VARIANTS = [
	{ markup: '*', paste: starPasteRegex },
	{ markup: '_', paste: underscorePasteRegex },
]

export function italicPasteRules(type: MarkType) {
	return MARKUP_VARIANTS.map(({ markup, paste }) =>
		markPasteRule({ find: paste, type, getAttributes: () => ({ markup }) })
	)
}
