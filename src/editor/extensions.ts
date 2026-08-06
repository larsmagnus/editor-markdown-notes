import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextStyle from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

/**
 * The subset of markdown-it we touch. The package is a transitive dependency of
 * `tiptap-markdown` and is not resolvable from here, so the shape is declared
 * rather than imported.
 */
interface MarkdownIt {
	linkify: {
		set: (options: { fuzzyLink: boolean; fuzzyEmail: boolean }) => void
	}
}

/**
 * With linkify on, markdown-it's fuzzy matching treats any prose that looks like
 * a domain as a link - so a heading reading `notes.md` is rewritten to
 * `[notes.md](http://notes.md)` on the first auto-save. Only linkify URLs that
 * carry an explicit scheme.
 *
 * `tiptap-markdown` calls `parse.setup` with its markdown-it instance on every
 * parse, which is the only hook it offers for configuring the parser.
 */
const StrictLinkify = Extension.create({
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

/**
 * The TipTap schema the editor runs on.
 *
 * `tiptap-markdown` ships serializers for tables, task lists and images, but
 * each one only activates when a TipTap extension of the matching name is
 * registered. Without the nodes below, markdown-it still parses these into
 * HTML and the ProseMirror schema then drops them - so they vanish from the
 * editor, and the next auto-save writes the loss back to disk.
 */
export const extensions = [
	Color.configure({ types: [TextStyle.name, ListItem.name] }),
	TextStyle.configure({ types: [ListItem.name] } as Partial<TextStyleOptions>),
	// Linkifying is markdown-it's job (see `linkify` below), which `StrictLinkify`
	// keeps to URLs with an explicit scheme. TipTap's own autolink plugin has no
	// such restriction and runs on every transaction, so with it on a heading
	// reading `notes.md` becomes `[notes.md](http://notes.md)`.
	Link.configure({ autolink: false }),
	StarterKit.configure({
		bulletList: {
			keepMarks: true,
			keepAttributes: false,
		},
		orderedList: {
			keepMarks: true,
			keepAttributes: false,
		},
	}),
	// Column resizing needs handle styling and a toolbar to be worth it - tables
	// are edited in place instead, with Tab/Shift-Tab moving between cells.
	Table.configure({ resizable: false }),
	TableRow,
	TableHeader,
	TableCell,
	// `tiptap-markdown` only adds its `tight` attribute to bulletList and
	// orderedList, so task lists would otherwise serialize with a blank line
	// between every item.
	TaskList.extend({
		addAttributes: () => ({ tight: { default: true, rendered: false } }),
	}),
	TaskItem.configure({ nested: true }),
	// Inline, so an image sits in a paragraph. As a block node the serializer
	// never closes the block and the image runs into the text that follows it.
	Image.configure({ inline: true }),
	Markdown.configure({
		// No p inside li in md
		tightLists: true,
		// Turn bare URLs into links. They serialize back in autolink form
		// (`<https://example.com>`) rather than as bare text.
		linkify: true,
	}),
	StrictLinkify,
]
