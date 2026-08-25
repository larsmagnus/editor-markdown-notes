import type { CommandProps } from '@tiptap/core'
import { mergeAttributes } from '@tiptap/core'
import Heading from '@tiptap/extension-heading'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Command as ProseMirrorCommand } from '@tiptap/pm/state'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import { createEnsureHeadingMarkerPlugin } from '@/editor/extensions/heading/ensure-heading-marker-plugin'
import { createHeadingInputRule } from '@/editor/extensions/heading/heading-input-rule'
import { parseHeadingLevel } from '@/editor/extensions/heading/heading-marker'
import { createHeadingNodeView } from '@/editor/extensions/heading/heading-node-view'
import { insertLiteralHeadingMarkers } from '@/editor/extensions/heading/insert-literal-heading-markers'
import {
	createSetHeadingCommand,
	createToggleHeadingCommand,
} from '@/editor/extensions/heading/toggle-heading-command'

/** Adapts a plain ProseMirror `Command` into TipTap's `addCommands` shape. */
function adaptCommand(command: ProseMirrorCommand) {
	return ({ state, dispatch }: CommandProps) => command(state, dispatch)
}

/** `heading-extension.ts` sets this true while serializing a heading's own marker text. */
export type HeadingSerializerState = MarkdownSerializerState & {
	inHeading?: boolean
}

/**
 * `level` is no longer a node attribute - the leading `#`x`level` + space is
 * real, editable text inside the heading's own content (see
 * `heading-marker.ts`), so an attribute kept in sync with it would be a
 * second source of truth for the same fact. Every reader of "what level is
 * this heading" parses the text instead (`parseHeadingLevel`). `heading-node-
 * view.ts` is what makes retyping the marker live-update the rendered tag -
 * ProseMirror's default node view only rebuilds a node's DOM on a type/attrs
 * change, never a text change, so without it the tag would stay stuck on
 * whatever it first rendered as. `heading-input-rule.ts` and
 * `ensure-heading-marker-plugin.ts` are what keep every path that can create
 * a `heading` node honest about there being marker text at all: neither the
 * toolbar's toggle nor a paste can produce one with none.
 */
export const HeadingExtension = Heading.extend({
	addAttributes() {
		return {}
	},

	parseHTML() {
		return this.options.levels.map((level: number) => ({ tag: `h${level}` }))
	},

	renderHTML({ node, HTMLAttributes }) {
		const level = parseHeadingLevel(node.textContent)
		return [
			`h${level}`,
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			0,
		]
	},

	addCommands() {
		type HeadingCommandFactory = (
			headingType: typeof this.type,
			paragraphType: typeof this.type,
			level: number
		) => ProseMirrorCommand

		const command =
			(create: HeadingCommandFactory) => (attributes: { level: number }) =>
				adaptCommand(
					create(
						this.type,
						this.editor.schema.nodes.paragraph,
						attributes.level
					)
				)

		return {
			setHeading: command(createSetHeadingCommand),
			toggleHeading: command(createToggleHeadingCommand),
		}
	},

	addInputRules() {
		return [createHeadingInputRule(this.type)]
	},

	addNodeView() {
		return ({ node }) => createHeadingNodeView(node)
	},

	addProseMirrorPlugins() {
		return [createEnsureHeadingMarkerPlugin(this.type)]
	},

	addStorage() {
		return {
			markdown: {
				// The node's content already contains its marker verbatim, so this
				// only needs to render it back out - synthesizing it here (the
				// stock behavior) would double it up on top of what's now real
				// content. `inHeading` tells the shared `esc()` patch
				// (`markdown-escaping.ts`) not to escape that marker as if it were
				// prose that merely started with `#`.
				serialize(state: HeadingSerializerState, node: ProseMirrorNode) {
					state.inHeading = true
					state.renderInline(node)
					state.inHeading = false
					state.closeBlock(node)
				},
				parse: {
					updateDOM: insertLiteralHeadingMarkers,
				},
			},
		}
	},
})
