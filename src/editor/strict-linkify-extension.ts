import { Extension } from '@tiptap/react'

import type { MarkdownIt } from '@/editor/markdown-it-types'

/**
 * Markdown-it's fuzzy linkify would turn prose that merely looks like a
 * domain into a link - a heading reading `notes.md` becomes
 * `[notes.md](http://notes.md)` on the first auto-save. Restrict it to URLs
 * with an explicit scheme.
 */
export const StrictLinkify = Extension.create({
	name: 'strictLinkify',
	addStorage: () => ({
		markdown: {
			parse: {
				setup(markdownit: MarkdownIt) {
					markdownit.linkify.set({ fuzzyLink: false, fuzzyEmail: false })
				},
			},
		},
	}),
})
