import type { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { parseLinkClose } from '@/editor/extensions/link/link-close-text'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'

/**
 * Keeps a link's `href`/`title` attributes matching whatever its own closing
 * delimiter text currently reads - the counterpart to `resolveClose` reading
 * attrs to *build* that text in the first place. Typing directly into a
 * revealed `(url "title")` is the primary way of editing an existing link
 * (see `link-extension.ts`), so without this the attributes - what
 * `renderHTML` reads to build the actual `<a href>` the click handler
 * navigates, and what the link popover seeds its field from - would stay
 * frozen at whatever they were when the link was first created.
 *
 * Skips a run with no closing delimiter yet (a bare autolink, or a run
 * `ensure-delimiters-plugin.ts` hasn't reached in this same pass) - there is
 * nothing to read attrs back from. Skips a run whose parsed href/title
 * already match, which is what keeps this from looping: once attrs and text
 * agree, no further transaction is produced.
 */
export function createSyncLinkAttrsPlugin(markType: MarkType): Plugin {
	return new Plugin({
		key: new PluginKey('linkSyncAttrs'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

			const spec = linkDelimiterSpec()
			let tr: Transaction | undefined

			for (const run of findMarkRuns(newState.doc, markType)) {
				const runText = newState.doc.textBetween(run.from, run.to)
				const closeLength = spec.detectClose(runText)
				if (closeLength === 0) continue

				const parsed = parseLinkClose(
					runText.slice(runText.length - closeLength)
				)
				if (!parsed) continue
				if (
					parsed.href === run.mark.attrs.href &&
					parsed.title === run.mark.attrs.title
				) {
					continue
				}

				const target = tr ?? newState.tr
				const nextMark = markType.create({
					...run.mark.attrs,
					href: parsed.href,
					title: parsed.title,
				})
				target.removeMark(run.from, run.to, markType)
				target.addMark(run.from, run.to, nextMark)
				tr = target
			}

			return tr
		},
	})
}
