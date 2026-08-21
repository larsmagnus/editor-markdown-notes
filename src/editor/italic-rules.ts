import {
	starInputRegex,
	starPasteRegex,
	underscoreInputRegex,
	underscorePasteRegex,
} from '@tiptap/extension-italic'
import { markInputRule, markPasteRule } from '@tiptap/react'
import type { MarkType } from 'prosemirror-model'

/** The two ways markdown spells italic, and each one's input/paste regex. */
const MARKUP_VARIANTS = [
	{ markup: '*', input: starInputRegex, paste: starPasteRegex },
	{ markup: '_', input: underscoreInputRegex, paste: underscorePasteRegex },
]

export function italicInputRules(type: MarkType) {
	return MARKUP_VARIANTS.map(({ markup, input }) =>
		markInputRule({ find: input, type, getAttributes: () => ({ markup }) })
	)
}

export function italicPasteRules(type: MarkType) {
	return MARKUP_VARIANTS.map(({ markup, paste }) =>
		markPasteRule({ find: paste, type, getAttributes: () => ({ markup }) })
	)
}
