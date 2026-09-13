import type { CommandProps } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskList from '@tiptap/extension-task-list'
import { TextStyle } from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'
import type { MarkdownStorage } from 'tiptap-markdown'
import { Markdown } from 'tiptap-markdown'

import { AskInlineStatus } from '#src/editor/extensions/ask/ask-inline-status-extension'
import { AskSuggestion } from '#src/editor/extensions/ask/ask-suggestion-extension'
import { BlockMarkers } from '#src/editor/extensions/block-marker/block-marker-extension'
import { createMarkerRevealProvider } from '#src/editor/extensions/block-marker/create-marker-reveal-provider'
import { MarkerBackspace } from '#src/editor/extensions/block-marker/marker-backspace-extension'
import { BLOCK_MARKER_SPECS } from '#src/editor/extensions/block-marker/specs'
import { withMarkerStrip } from '#src/editor/extensions/block-marker/with-marker-strip'
import { BlockquoteExtension } from '#src/editor/extensions/blockquote/blockquote-extension'
import { CodeBlockExtension } from '#src/editor/extensions/code-block/code-block-extension'
import { CodeExtension } from '#src/editor/extensions/code-block/code-extension'
import { FocusNavigation } from '#src/editor/extensions/focus-navigation/focus-navigation-extension'
import { BoldExtension } from '#src/editor/extensions/formatting/bold-extension'
import { createDelimitedMarkRevealProvider } from '#src/editor/extensions/formatting/create-delimited-mark-reveal-provider'
import { fixedDelimiter } from '#src/editor/extensions/formatting/delimiter-spec'
import { inlineCodeDelimiterSpec } from '#src/editor/extensions/formatting/inline-code/inline-code-delimiter-spec'
import { StrikeExtension } from '#src/editor/extensions/formatting/strike-extension'
import { HeadingExtension } from '#src/editor/extensions/heading/heading-extension'
import { HorizontalRuleExtension } from '#src/editor/extensions/horizontal-rule/horizontal-rule-extension'
import { ImageSource } from '#src/editor/extensions/image/edit-source'
import { ImageExtension } from '#src/editor/extensions/image/image-extension'
import { italicDelimiterSpec } from '#src/editor/extensions/italic/italic-delimiter-spec'
import { ItalicExtension } from '#src/editor/extensions/italic/italic-extension'
import { linkDelimiterSpec } from '#src/editor/extensions/link/link-delimiter-spec'
import { LinkExtension } from '#src/editor/extensions/link/link-extension'
import { StrictLinkify } from '#src/editor/extensions/link/strict-linkify-extension'
import { ListEnter } from '#src/editor/extensions/list/list-enter-extension'
import { ListItemExtension } from '#src/editor/extensions/list/list-item-extension'
import { MarkdownClipboard } from '#src/editor/extensions/markdown/markdown-clipboard-extension'
import { patchMarkdownEscaping } from '#src/editor/extensions/markdown/markdown-escaping'
import { MdxBlockExtension } from '#src/editor/extensions/mdx-block/mdx-block-extension'
import { ParagraphExtension } from '#src/editor/extensions/paragraph-extension'
import { SearchRevealHighlight } from '#src/editor/extensions/search-reveal/search-reveal-extension'
import { SlashCommand } from '#src/editor/extensions/slash-command/slash-command-extension'
import { SyntaxHighlight } from '#src/editor/extensions/syntax-highlight/syntax-highlight-extension'
import { SyntaxReveal } from '#src/editor/extensions/syntax-reveal/syntax-reveal-extension'
import { TabIndent } from '#src/editor/extensions/tab-indent/tab-indent-extension'
import { TableCommands } from '#src/editor/extensions/table/commands'
import { MarkdownTable } from '#src/editor/extensions/table/table-extension'
import { TaskItemExtension } from '#src/editor/extensions/task-item/task-item-extension'
import { TextTools } from '#src/editor/extensions/text-tools/text-tools-extension'

patchMarkdownEscaping()

/**
 * `tiptap-markdown`'s table/task-list/image serializers only activate when a
 * same-named extension is registered somewhere in `SHARED_HEAD_EXTENSIONS`/
 * `SHARED_TAIL_EXTENSIONS` below - without a node for each of them,
 * markdown-it parses that construct into HTML the schema then drops, and the
 * next auto-save writes the loss to disk.
 */

/**
 * The extensions every file kind shares, minus `Document`/`Frontmatter` -
 * `buildExtensions` (`build-extensions.ts`) splices those two in per file
 * kind, since they're the only pair that varies.
 */
export const SHARED_HEAD_EXTENSIONS = [
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
		// Replaced below so consecutive blank lines survive serialization.
		paragraph: false,
	}),
]

/**
 * Everything after the `Document`/`Frontmatter` pair `buildExtensions`
 * (`build-extensions.ts`) splices in per file kind.
 */
export const SHARED_TAIL_EXTENSIONS = [
	ParagraphExtension,
	CodeBlockExtension,
	HorizontalRuleExtension,
	// Only reachable on `.mdx` files - `restoreMdxBlocksInTransaction` is the
	// sole place that ever creates one. Harmless to register unconditionally.
	MdxBlockExtension,
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
