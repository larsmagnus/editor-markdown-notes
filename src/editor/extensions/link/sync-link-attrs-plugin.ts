import type { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'
import { parseLinkClose } from '@/editor/extensions/link/link-close-text'
import { linkDelimiterSpec } from '@/editor/extensions/link/link-delimiter-spec'
import { anyDocChanged } from '@/editor/extensions/transaction-filters'

/**
 * Keeps a link's `href`/`title` matching whatever its closing delimiter text
 * reads - the counterpart to `resolveClose`, which builds that text from the
 * attrs. Typing into a revealed `(url "title")` is the primary way of editing
 * a link, and without this the rendered `<a href>` stays frozen at creation.
 *
 * A run with no closing delimiter yet has nothing to read attrs back from. A
 * run whose parsed values already match produces no transaction, which is what
 * keeps this from looping.
 */
export function createSyncLinkAttrsPlugin(markType: MarkType): Plugin {
	return new Plugin({
		key: new PluginKey('linkSyncAttrs'),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!anyDocChanged(transactions)) return null

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
