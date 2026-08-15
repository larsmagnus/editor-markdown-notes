import CodeBlock from '@tiptap/extension-code-block'
import { Color } from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { TextStyle } from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import type { Command } from '@tiptap/pm/state'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { MarkdownStorage } from 'tiptap-markdown'
import { Markdown } from 'tiptap-markdown'

import { CodeBlockView } from '@/editor/code-block-view'
import { CodeExtension } from '@/editor/code-extension'
import { Frontmatter } from '@/editor/frontmatter/extension'
import {
	focusImageToolbar,
	moveToAdjacentImage,
} from '@/editor/image/keyboard-nav'
import { ItalicExtension } from '@/editor/italic-extension'
import { MarkdownClipboard } from '@/editor/markdown-clipboard-extension'
import { patchMarkdownEscaping } from '@/editor/markdown-escaping'
import { SlashCommand } from '@/editor/slash-command/extension'
import { StrictLinkify } from '@/editor/strict-linkify-extension'
import { SyntaxHighlight } from '@/editor/syntax-highlight-extension'
import { TabIndent } from '@/editor/tab-indent-extension'
import { TableCommands } from '@/editor/table/commands'
import { MarkdownTable } from '@/editor/table/extension'
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
		// StarterKit bundles both as of v3. Link is registered above instead
		// (autolink disabled); underline stays unsupported (see CLAUDE.md).
		link: false,
		underline: false,
		// Replaced below so the top-level content expression can require
		// frontmatter, if present, to be the document's first node.
		document: false,
	}),
	// `frontmatter?` goes first in the content expression so at most one can
	// exist and it can only ever be the document's first child - the schema
	// enforces the position, no `appendTransaction` policing needed for it
	// the way the table's header row does.
	Document.extend({ content: 'frontmatter? block+' }),
	Frontmatter,
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
	// Reordering and column alignment, neither of which TipTap exposes.
	TableCommands,
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
	// `draggable` (native drag-and-drop reordering) is already the extension's
	// default. `atom` is not: without it, ProseMirror places a text cursor next
	// to a click on the image instead of selecting the node, so a click never
	// produces the `NodeSelection` the bubble menu's image controls key off.
	Image.configure({ inline: true }).extend({
		atom: true,
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
		// `Tab`/`Shift-Tab` jump between images the way they jump between fields
		// in a form; arrow keys then move into the selected image's bubble menu,
		// the same composite-widget pattern the table handles use for their
		// menus. Declining (returning `false`) hands the key back to the
		// browser/other extensions - off the last image that means the page's
		// own next focusable element, not a trap inside the editor.
		addKeyboardShortcuts() {
			// The view goes through too: `moveToAdjacentImage` calls `view.focus()`
			// to keep the bubble menu's `hasFocus()` check satisfied, and
			// `focusImageToolbar` reads the rendered toolbar off the real DOM.
			const run = (command: Command) => () =>
				command(this.editor.state, this.editor.view.dispatch, this.editor.view)

			return {
				Tab: run(moveToAdjacentImage(1)),
				'Shift-Tab': run(moveToAdjacentImage(-1)),
				ArrowRight: run(focusImageToolbar()),
				ArrowDown: run(focusImageToolbar()),
			}
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
	// Registered after `Markdown`, whose `onBeforeCreate` builds the parser and
	// serializer this reads off `editor.storage`.
	MarkdownClipboard,
	// Decorations only, and inert until the text tools panel feeds it issues.
	// Registered unconditionally because the editor is built once.
	TextTools,
	// Decorations only, and inert until `useSyntaxHighlight` feeds it tokens.
	SyntaxHighlight,
	// Otherwise unhandled, Tab is a browser default: it moves focus to the next
	// focusable element on the page rather than indenting. Declines inside a
	// table cell and when a node (not a text caret) is selected, so it doesn't
	// compete with those keys' own meanings elsewhere in this file.
	TabIndent,
	// A plugin + keyboard handling only, no schema node, so it can sit anywhere.
	SlashCommand,
]

// `tiptap-markdown` ships no `Storage` module augmentation of its own, so
// `editor.storage.markdown` is otherwise typed `never`.
declare module '@tiptap/core' {
	interface Storage {
		markdown: MarkdownStorage
	}
}
