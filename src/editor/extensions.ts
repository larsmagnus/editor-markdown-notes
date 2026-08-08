import CodeBlock from '@tiptap/extension-code-block'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextStyle from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { CodeBlockView } from '@/editor/code-block-view'
import { CodeExtension } from '@/editor/code-extension'
import { ItalicExtension } from '@/editor/italic-extension'
import { patchMarkdownEscaping } from '@/editor/markdown-escaping'
import { StrictLinkify } from '@/editor/strict-linkify-extension'
import { MarkdownTable } from '@/editor/table-extension'
import { TextTools } from '@/editor/text-tools-extension'
import { resolveImageSrc } from '@/lib/resolve-image-src'

patchMarkdownEscaping()

/**
 * The TipTap schema the editor runs on. `tiptap-markdown`'s table/task-list/
 * image serializers only activate when a same-named extension is
 * registered - without the nodes below, markdown-it parses them into HTML
 * that the schema then drops, and the next auto-save writes the loss to disk.
 *
 * `Code`/`Italic`/`Table` are StarterKit's defaults disabled and replaced by
 * their own file in this folder - see each for why.
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
		codeBlock: false,
		code: false,
		italic: false,
	}),
	// The name stays `codeBlock`, which is what keeps `tiptap-markdown`'s fenced
	// block serializer attached. The node view only changes how a block is drawn:
	// a `mermaid` one renders its diagram, everything else stays a `<pre>`.
	CodeBlock.extend({
		addNodeView: () => ReactNodeViewRenderer(CodeBlockView),
	}),
	// Order nests marks: Italic before Code so `*text `code` text*` nests as
	// `*` around the backticks rather than the reverse (mark rank, not source
	// order, decides nesting - see each file's comment for why they coexist).
	ItalicExtension,
	CodeExtension,
	// Column resizing needs handle styling and a toolbar to be worth it - tables
	// are edited in place instead, with Tab/Shift-Tab moving between cells.
	MarkdownTable,
	TableRow,
	// Cells hold inline content directly. TipTap's default is `block+`, which
	// wraps every cell in a paragraph.
	TableHeader.extend({ content: 'inline*' }),
	TableCell.extend({ content: 'inline*' }),
	// `tiptap-markdown` only adds its `tight` attribute to bulletList and
	// orderedList, so task lists would otherwise serialize with a blank line
	// between every item.
	TaskList.extend({
		addAttributes: () => ({ tight: { default: true, rendered: false } }),
	}),
	TaskItem.configure({ nested: true }),
	// Inline, so an image sits in a paragraph. As a block node the serializer
	// never closes the block and the image runs into the text that follows it.
	Image.configure({ inline: true }).extend({
		// Display only - `src` keeps the author's path, so saving does not
		// rewrite the file with vscode-resource URIs. Outside VSCode there are
		// no bases: the notes are served from the site root, so the browser
		// already resolves the author's path correctly.
		renderHTML({ HTMLAttributes }) {
			return [
				'img',
				mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
					src: resolveImageSrc(
						String(HTMLAttributes.src ?? ''),
						window.imageBaseUris
					),
				}),
			]
		},
	}),
	Markdown.configure({
		// No p inside li in md
		tightLists: true,
		// Turn bare URLs into links. They serialize back in autolink form
		// (`<https://example.com>`) rather than as bare text.
		linkify: true,
	}),
	StrictLinkify,
	// Decorations only, and inert until the text tools panel feeds it issues.
	// Registered unconditionally because the editor is built once.
	TextTools,
]
