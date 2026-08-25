import type { CommandProps } from '@tiptap/core'
import Link from '@tiptap/extension-link'

import { createDelimitedMarkExtension } from '@/editor/extensions/formatting/delimited-mark-extension'
import { createApplyLinkCommand } from '@/editor/extensions/link/apply-link-command'
import type { LinkAttrs } from '@/editor/extensions/link/apply-link-command'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'
import { LINK_MARKDOWN_SERIALIZE } from '@/editor/extensions/link/link-markdown-spec'
import { createSyncLinkAttrsPlugin } from '@/editor/extensions/link/sync-link-attrs-plugin'
import { createUnlinkCommand } from '@/editor/extensions/link/unlink-command'

/**
 * `[text](href "title")` with real, caret-revealed delimiter text - built on
 * `delimited-mark-extension.ts`, but keeping `href`/`title` as real schema
 * attributes rather than dropping them the way headings dropped `level`:
 * an image wrapped in a link has no text content at all to hold literal
 * syntax in (see `link-markdown-spec.ts`), so attrs stay the only source of
 * truth for that case, and doubly serve as the seed `link-delimiter-spec.ts`
 * resolves fresh delimiter text from for the text case. Ranked above
 * bold/strike/italic/code in `uniform-outer-marks.ts`'s nesting order (a
 * bolded link's `**` sits outside its brackets, not inside).
 *
 * `createSyncLinkAttrsPlugin` is the reverse direction: typing directly into
 * a revealed `(url)` is the primary way of editing an existing link (see
 * `apply-link-command.ts`'s doc comment), so without it the attrs -
 * `renderHTML`'s `<a href>`, the click handler that navigates it, the
 * popover's seeded field - would stay frozen at whatever they were when the
 * link was first created.
 */
// TODO: relative links (`[notes](./notes.md)`) currently fall through to
// @tiptap/extension-link's default openOnClick, which calls
// window.open(href, '_blank') - a no-op for a relative path inside the
// VS Code webview. Should instead open through the host, mirroring VS
// Code's own file-link convention: a plain click reuses the existing
// preview tab (italic tab title), a stronger trigger (double-click/
// cmd-click) opens a new permanent tab. src/host/open-file-command.ts
// (openFile, via vscode.openWith) and src/host/open-in-text-editor-
// command.ts are the closest existing precedent, but neither takes a
// ViewColumn/preview-mode argument yet, and webview-message-handlers.ts
// has no link-related message type - both would need to be added.
export const LinkExtension = createDelimitedMarkExtension(Link, {
	ensureSpec: linkDelimiterSpec(),
	serialize: LINK_MARKDOWN_SERIALIZE,
}).extend({
	addProseMirrorPlugins() {
		return [...(this.parent?.() ?? []), createSyncLinkAttrsPlugin(this.type)]
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
