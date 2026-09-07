import type { CommandProps } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskList from '@tiptap/extension-task-list'
import { TextStyle } from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'
import type { MarkdownStorage } from 'tiptap-markdown'
import { Markdown } from 'tiptap-markdown'

import { AskInlineStatus } from '@/editor/extensions/ask/ask-inline-status-extension'
import { AskSuggestion } from '@/editor/extensions/ask/ask-suggestion-extension'
import { BlockMarkers } from '@/editor/extensions/block-marker/block-marker-extension'
import { createMarkerRevealProvider } from '@/editor/extensions/block-marker/create-marker-reveal-provider'
import { MarkerBackspace } from '@/editor/extensions/block-marker/marker-backspace-extension'
import { BLOCK_MARKER_SPECS } from '@/editor/extensions/block-marker/specs'
import { withMarkerStrip } from '@/editor/extensions/block-marker/with-marker-strip'
import { BlockquoteExtension } from '@/editor/extensions/blockquote/blockquote-extension'
import { CodeBlockExtension } from '@/editor/extensions/code-block/code-block-extension'
import { CodeExtension } from '@/editor/extensions/code-block/code-extension'
import { FocusNavigation } from '@/editor/extensions/focus-navigation/focus-navigation-extension'
import { BoldExtension } from '@/editor/extensions/formatting/bold-extension'
import { createDelimitedMarkRevealProvider } from '@/editor/extensions/formatting/create-delimited-mark-reveal-provider'
import { fixedDelimiter } from '@/editor/extensions/formatting/delimiter-spec'
import { inlineCodeDelimiterSpec } from '@/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'
import { StrikeExtension } from '@/editor/extensions/formatting/strike-extension'
import { Frontmatter } from '@/editor/extensions/frontmatter/frontmatter-extension'
import { HeadingExtension } from '@/editor/extensions/heading/heading-extension'
import { HorizontalRuleExtension } from '@/editor/extensions/horizontal-rule/horizontal-rule-extension'
import { ImageSource } from '@/editor/extensions/image/edit-source'
import { ImageExtension } from '@/editor/extensions/image/image-extension'
import { italicDelimiterSpec } from '@/editor/extensions/italic/italic-delimiter-spec'
import { ItalicExtension } from '@/editor/extensions/italic/italic-extension'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'
import { LinkExtension } from '@/editor/extensions/link/link-extension'
import { StrictLinkify } from '@/editor/extensions/link/strict-linkify-extension'
import { ListEnter } from '@/editor/extensions/list/list-enter-extension'
import { ListItemExtension } from '@/editor/extensions/list/list-item-extension'
import { MarkdownClipboard } from '@/editor/extensions/markdown/markdown-clipboard-extension'
import { patchMarkdownEscaping } from '@/editor/extensions/markdown/markdown-escaping'
import { SearchRevealHighlight } from '@/editor/extensions/search-reveal/search-reveal-extension'
import { SlashCommand } from '@/editor/extensions/slash-command/slash-command-extension'
import { SyntaxHighlight } from '@/editor/extensions/syntax-highlight/syntax-highlight-extension'
import { SyntaxReveal } from '@/editor/extensions/syntax-reveal/syntax-reveal-extension'
import { TabIndent } from '@/editor/extensions/tab-indent/tab-indent-extension'
import { TableCommands } from '@/editor/extensions/table/commands'
import { MarkdownTable } from '@/editor/extensions/table/table-extension'
import { TaskItemExtension } from '@/editor/extensions/task-item/task-item-extension'
import { TextTools } from '@/editor/extensions/text-tools/text-tools-extension'

patchMarkdownEscaping()

/**
 * The TipTap schema the editor runs on. `tiptap-markdown`'s table/task-list/
 * image serializers only activate when a same-named extension is registered -
 * without the nodes below, markdown-it parses them into HTML that the schema
 * then drops, and the next auto-save writes the loss to disk.
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
		blockquote: false,
		// Disabled here, replaced by their own file in this folder or `formatting/`.
		bold: false,
		strike: false,
		// Bundled as of v3. Link is registered below with autolink disabled;
		// underline stays unsupported (see CLAUDE.md).
		link: false,
		underline: false,
		// Replaced below so the top-level content expression can require
		// frontmatter, if present, to be the document's first node.
		document: false,
		// Replaced below by its own file in `list/` - see why.
		listItem: false,
		// Replaced below: a rule holds its own `---` as text, which a leaf atom
		// cannot do.
		horizontalRule: false,
	}),
	// `frontmatter?` first, so the schema itself enforces "at most one, always
	// the document's first child" - no `appendTransaction` policing needed.
	Document.extend({ content: 'frontmatter? block+' }),
	Frontmatter,
	CodeBlockExtension,
	HorizontalRuleExtension,
	HeadingExtension,
	BlockquoteExtension,
	ListItemExtension,
	// The shared strip pass every block marker's toggle-off relies on.
	BlockMarkers,
	// Linkifying is markdown-it's job, kept to URLs with an explicit scheme by
	// `StrictLinkify`. TipTap's own autolink plugin has no such restriction and
	// runs on every transaction, turning a heading reading `notes.md` into
	// `[notes.md](http://notes.md)`.
	//
	// Registration order is mark rank, which decides nesting: Link before
	// Italic before Code, so `*text `code` text*` nests `*` around the ticks.
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
		addCommands() {
			const parent = this.parent?.()

			return {
				...parent,
				toggleTaskList: () => (props: CommandProps) =>
					withMarkerStrip(
						props,
						{ toggled: this.name, marker: 'taskItem' },
						() => Boolean(parent?.toggleTaskList?.()(props))
					),
			}
		},
	}),
	TaskItemExtension,
	// After both item types, so its Enter outranks their own `splitListItem`.
	ListEnter,
	ImageExtension,
	ImageSource,
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
	// Decorations only, inert until the text tools panel feeds it issues. All
	// four below are registered unconditionally: the editor is built once, and a
	// conditional extension list would tear it down on every toggle.
	TextTools,
	// Inert unless the note was opened from a search result.
	SearchRevealHighlight,
	// Inert until `useSyntaxHighlight` feeds it tokens.
	SyntaxHighlight,
	// Inert until the bubble menu's sparkles popover starts a proposal.
	AskSuggestion,
	// Inert until the `/ask` slash command starts one.
	AskInlineStatus,
	// Hides markdown syntax while the caret is elsewhere; every revealable
	// construct contributes a provider here.
	SyntaxReveal.configure({
		providers: [
			createMarkerRevealProvider(BLOCK_MARKER_SPECS),
			createDelimitedMarkRevealProvider('link', linkDelimiterSpec()),
			createDelimitedMarkRevealProvider('bold', fixedDelimiter('**')),
			createDelimitedMarkRevealProvider('strike', fixedDelimiter('~~')),
			createDelimitedMarkRevealProvider('italic', italicDelimiterSpec()),
			createDelimitedMarkRevealProvider('code', inlineCodeDelimiterSpec()),
		],
	}),
	// Unhandled, Tab moves focus rather than indenting. Declines inside a table
	// cell and on a node selection, so it never competes with those meanings.
	TabIndent,
	// Registered after every marker-bearing node extension, so its Backspace
	// handler runs before their own deletion behavior - in particular the stock
	// Blockquote's, which treats offset 0 (before the marker) as the exit point.
	MarkerBackspace,
	// The WCAG "no keyboard trap" escape hatch, outranking every Tab handler
	// registered earlier and yielding to SlashCommand's popup.
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
