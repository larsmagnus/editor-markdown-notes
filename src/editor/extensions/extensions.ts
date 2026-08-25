import { Color } from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import Image from '@tiptap/extension-image'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskList from '@tiptap/extension-task-list'
import { TextStyle } from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import type { Command } from '@tiptap/pm/state'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { MarkdownStorage } from 'tiptap-markdown'
import { Markdown } from 'tiptap-markdown'

import { AskInlineStatus } from '@/editor/extensions/ask/ask-inline-status-extension'
import { AskSuggestion } from '@/editor/extensions/ask/ask-suggestion-extension'
import { CodeBlockExtension } from '@/editor/extensions/code-block/code-block-extension'
import { CodeExtension } from '@/editor/extensions/code-block/code-extension'
import { parseFence } from '@/editor/extensions/code-block/code-fence'
import { FocusNavigation } from '@/editor/extensions/focus-navigation/focus-navigation-extension'
import { BoldExtension } from '@/editor/extensions/formatting/bold-extension'
import { createDelimitedMarkRevealProvider } from '@/editor/extensions/formatting/create-delimited-mark-reveal-provider'
import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'
import { inlineCodeDelimiterSpec } from '@/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'
import { StrikeExtension } from '@/editor/extensions/formatting/strike-extension'
import { Frontmatter } from '@/editor/extensions/frontmatter/frontmatter-extension'
import { HeadingExtension } from '@/editor/extensions/heading/heading-extension'
import { parseHeadingReveal } from '@/editor/extensions/heading/heading-reveal'
import { ImageView } from '@/editor/extensions/image/image-view'
import {
	focusImageSourceField,
	focusImageToolbar,
	moveToAdjacentImage,
} from '@/editor/extensions/image/keyboard-nav'
import { italicDelimiterSpec } from '@/editor/extensions/italic/italic-delimiter-spec'
import { ItalicExtension } from '@/editor/extensions/italic/italic-extension'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'
import { LinkExtension } from '@/editor/extensions/link/link-extension'
import { StrictLinkify } from '@/editor/extensions/link/strict-linkify-extension'
import { ListItemExtension } from '@/editor/extensions/list/list-item-extension'
import { ListMarkerBackspace } from '@/editor/extensions/list/list-marker-backspace-extension'
import { createListMarkerRevealProvider } from '@/editor/extensions/list/list-marker-reveal-provider'
import { MarkdownClipboard } from '@/editor/extensions/markdown/markdown-clipboard-extension'
import { patchMarkdownEscaping } from '@/editor/extensions/markdown/markdown-escaping'
import { SearchRevealHighlight } from '@/editor/extensions/search-reveal/search-reveal-extension'
import { SlashCommand } from '@/editor/extensions/slash-command/slash-command-extension'
import { SyntaxHighlight } from '@/editor/extensions/syntax-highlight/syntax-highlight-extension'
import { createFenceRevealProvider } from '@/editor/extensions/syntax-reveal/create-fence-reveal-provider'
import { SyntaxReveal } from '@/editor/extensions/syntax-reveal/syntax-reveal-extension'
import { TabIndent } from '@/editor/extensions/tab-indent/tab-indent-extension'
import { TableCommands } from '@/editor/extensions/table/commands'
import { MarkdownTable } from '@/editor/extensions/table/table-extension'
import { TaskItemExtension } from '@/editor/extensions/task-item/task-item-extension'
import { TextTools } from '@/editor/extensions/text-tools/text-tools-extension'
import { resolveImageSrc } from '@/lib/host/resolve-image-src'

patchMarkdownEscaping()

/**
 * The TipTap schema the editor runs on. `tiptap-markdown`'s table/task-list/
 * image serializers only activate when a same-named extension is
 * registered - without the nodes below, markdown-it parses them into HTML
 * that the schema then drops, and the next auto-save writes the loss to disk.
 *
 * `Code`/`Italic`/`Bold`/`Strike`/`Table` are StarterKit's defaults disabled
 * and replaced by their own file in this folder - see each for why.
 */
export const extensions = [
	Color.configure({ types: [TextStyle.name, ListItemExtension.name] }),
	TextStyle.configure({
		types: [ListItemExtension.name],
	} as Partial<TextStyleOptions>),
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
		heading: false,
		// `Bold`/`Strike`/`Italic`/`Code`/`Heading` are StarterKit's defaults
		// disabled and replaced by their own file in this folder or `formatting/`
		// - see each for why.
		bold: false,
		strike: false,
		// StarterKit bundles both as of v3. Link is registered below instead
		// (autolink disabled); underline stays unsupported (see CLAUDE.md).
		link: false,
		underline: false,
		// Replaced below so the top-level content expression can require
		// frontmatter, if present, to be the document's first node.
		document: false,
		// Replaced below by its own file in `list/` - see why.
		listItem: false,
	}),
	// `frontmatter?` goes first in the content expression so at most one can
	// exist and it can only ever be the document's first child - the schema
	// enforces the position, no `appendTransaction` policing needed for it
	// the way the table's header row does.
	Document.extend({ content: 'frontmatter? block+' }),
	Frontmatter,
	CodeBlockExtension,
	HeadingExtension,
	ListItemExtension,
	// Linkifying is markdown-it's job (see `linkify` below), which `StrictLinkify`
	// keeps to URLs with an explicit scheme. TipTap's own autolink plugin has no
	// such restriction and runs on every transaction, so with it on a heading
	// reading `notes.md` becomes `[notes.md](http://notes.md)`.
	//
	// Order nests marks: Link before Italic before Code so e.g. `*text `code`
	// text*` nests as `*` around the backticks rather than the reverse (mark
	// rank, not source order, decides nesting - see each file's comment for why
	// they coexist).
	LinkExtension.configure({ autolink: false }),
	ItalicExtension,
	CodeExtension,
	BoldExtension,
	StrikeExtension,
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
	TaskItemExtension,
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
		// `renderHTML` above still drives `getHTML()`/copy-paste HTML - this only
		// takes over the live, interactive editor, revealing `![alt](src
		// "title")` underneath as real editable text whenever the caret sits on
		// or beside the image (`image-view.tsx`).
		addNodeView() {
			return ReactNodeViewRenderer(ImageView)
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
			const run =
				(...commands: Command[]) =>
				() =>
					commands.some((command) =>
						command(
							this.editor.state,
							this.editor.view.dispatch,
							this.editor.view
						)
					)

			return {
				Tab: run(moveToAdjacentImage(1)),
				'Shift-Tab': run(moveToAdjacentImage(-1)),
				ArrowRight: run(focusImageToolbar()),
				ArrowDown: run(focusImageToolbar()),
				// Declines unless the image is already selected, falling through to
				// ProseMirror's default node deletion for every other Backspace.
				Backspace: run(focusImageSourceField()),
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
	// Decorations only, and inert unless the note was opened from a search
	// result - which is what `useSearchReveal` feeds it.
	SearchRevealHighlight,
	// Decorations only, and inert until `useSyntaxHighlight` feeds it tokens.
	SyntaxHighlight,
	// Decorations only, and inert until the bubble menu's sparkles popover
	// starts a proposal. Registered unconditionally for the same reason as
	// `TextTools` and `SyntaxHighlight` above: the editor is built once.
	AskSuggestion,
	// Decorations only, and inert until the `/ask` slash command starts one.
	AskInlineStatus,
	// Decorations only, hiding markdown syntax (fences, delimiters, markers)
	// while the caret is elsewhere. Other constructs register their own
	// provider here as they land.
	SyntaxReveal.configure({
		providers: [
			createFenceRevealProvider(['codeBlock'], parseFence),
			createFenceRevealProvider(['heading'], parseHeadingReveal),
			createListMarkerRevealProvider(['listItem', 'taskItem']),
			createDelimitedMarkRevealProvider('link', linkDelimiterSpec()),
			createDelimitedMarkRevealProvider('bold', fixedDelimiter('**')),
			createDelimitedMarkRevealProvider('strike', fixedDelimiter('~~')),
			createDelimitedMarkRevealProvider('italic', italicDelimiterSpec()),
			createDelimitedMarkRevealProvider('code', inlineCodeDelimiterSpec()),
		],
	}),
	// Otherwise unhandled, Tab is a browser default: it moves focus to the next
	// focusable element on the page rather than indenting. Declines inside a
	// table cell and when a node (not a text caret) is selected, so it doesn't
	// compete with those keys' own meanings elsewhere in this file.
	TabIndent,
	// Registered after ListItemExtension/TaskItemExtension so its Backspace
	// handler runs before their own default deletion behavior.
	ListMarkerBackspace,
	// The WCAG "no keyboard trap" escape hatch. Outranks TabIndent, the image
	// node's Tab shortcut, and the table's Tab-between-cells keymap (all
	// registered earlier); yields to SlashCommand's own popup.
	FocusNavigation,
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
