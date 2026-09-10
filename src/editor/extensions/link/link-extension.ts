import type { CommandProps } from '@tiptap/core'
import Link from '@tiptap/extension-link'

import { createDelimitedMarkExtension } from '#src/editor/extensions/formatting/delimited-mark-extension'
import { createApplyLinkCommand } from '#src/editor/extensions/link/apply-link-command'
import type { LinkAttrs } from '#src/editor/extensions/link/apply-link-command'
import { createLinkClickHandler } from '#src/editor/extensions/link/link-click-handler'
import { linkDelimiterSpec } from '#src/editor/extensions/link/link-delimiter-spec'
import { LINK_MARKDOWN_SERIALIZE } from '#src/editor/extensions/link/link-markdown-spec'
import { createSyncLinkAttrsPlugin } from '#src/editor/extensions/link/sync-link-attrs-plugin'
import { createUnlinkCommand } from '#src/editor/extensions/link/unlink-command'

/**
 * `[text](href "title")` with real, caret-revealed delimiter text. Unlike a
 * heading's `level`, `href`/`title` stay real schema attributes: an image
 * wrapped in a link has no text content to hold literal syntax in, so attrs
 * are the only source of truth there, and the seed fresh delimiter text is
 * resolved from everywhere else. Outranks bold/strike/italic/code in nesting,
 * so a bolded link's `**` sits outside its brackets.
 *
 * `createSyncLinkAttrsPlugin` runs the reverse direction: typing into a
 * revealed `(url)` is the primary way of editing a link, and without it the
 * rendered `<a href>` and the popover's field stay frozen at creation time.
 */
export const LinkExtension = createDelimitedMarkExtension(Link, {
	ensureSpec: linkDelimiterSpec(),
	serialize: LINK_MARKDOWN_SERIALIZE,
}).extend({
	// Stock `openOnClick` has no hook to bail only for a relative href, so it's
	// off here and reimplemented, absolute URL included, by
	// `link-click-handler.ts` - the plugin below.
	addOptions() {
		return { ...this.parent?.(), openOnClick: false }
	},

	addProseMirrorPlugins() {
		return [
			...(this.parent?.() ?? []),
			createSyncLinkAttrsPlugin(this.type),
			createLinkClickHandler(),
		]
	},

	addCommands() {
		return {
			...this.parent?.(),
			setLink:
				(attrs: LinkAttrs) =>
				({ state, dispatch }: CommandProps) =>
					createApplyLinkCommand(this.type, attrs)(state, dispatch),
			toggleLink:
				(attrs?: LinkAttrs) =>
				({ state, dispatch }: CommandProps) => {
					if (this.editor.isActive(this.name)) {
						return createUnlinkCommand(this.type)(state, dispatch)
					}
					if (!attrs) return false
					return createApplyLinkCommand(this.type, attrs)(state, dispatch)
				},
			unsetLink:
				() =>
				({ state, dispatch }: CommandProps) =>
					createUnlinkCommand(this.type)(state, dispatch),
		}
	},
})
