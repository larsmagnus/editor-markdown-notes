import {
	starInputRegex,
	starPasteRegex,
	underscoreInputRegex,
	underscorePasteRegex,
} from '@tiptap/extension-italic'
import { markInputRule, markPasteRule } from '@tiptap/react'
import type { MarkType } from 'prosemirror-model'

export function italicInputRules(type: MarkType) {
	return [
		markInputRule({
			find: starInputRegex,
			type,
			getAttributes: () => ({ markup: '*' }),
		}),
		markInputRule({
			find: underscoreInputRegex,
			type,
			getAttributes: () => ({ markup: '_' }),
		}),
	]
}

export function italicPasteRules(type: MarkType) {
	return [
		markPasteRule({
			find: starPasteRegex,
			type,
			getAttributes: () => ({ markup: '*' }),
		}),
		markPasteRule({
			find: underscorePasteRegex,
			type,
			getAttributes: () => ({ markup: '_' }),
		}),
	]
}
