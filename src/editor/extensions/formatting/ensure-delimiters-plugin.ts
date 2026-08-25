import type { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'

import { findMarkRuns } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * Extends any run of `markType` missing its delimiter text at either end -
 * a safety net for every way a mark can be applied without going through
 * `wrap-selection-with-delimiter.ts`: HTML paste applying the mark directly,
 * a future `insertContent` call, or any other command that calls `setMark`.
 * Without this, such a run looks fenced in the editor while its markdown
 * serializer (now near-identity, since delimiters are normally real,
 * marked text - see `delimited-mark-extension.ts`) would write it out with
 * no markup at all.
 *
 * The inserted delimiter text carries the mark explicitly
 * (`schema.text(delimiter, [run.mark])`), the same as
 * `wrap-selection-with-delimiter.ts` - not left to whatever mark `tr.insert`
 * would otherwise infer from the insertion point, which is exactly the
 * ambiguity a plain `tr.insertText` used to resolve inconsistently at the
 * two ends of a run.
 *
 * Runs are fixed in *reverse* document order: inserting text at a later
 * run's boundary never shifts an earlier run's positions, so each run's
 * `from`/`to` (read once, from `newState.doc`) stays valid through every
 * insertion that follows it in this same pass - fixing forward would
 * invalidate every not-yet-visited run's positions the moment an earlier
 * one's delimiters were inserted.
 */
export function createEnsureDelimitersPlugin(
	markType: MarkType,
	delimiter: string
): Plugin {
	return new Plugin({
		key: new PluginKey(`ensureDelimiters$${markType.name}`),
		appendTransaction: (transactions, _oldState, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged)) {
				return null
			}

			const runs = findMarkRuns(newState.doc, markType)
			let tr: Transaction | undefined

			for (const run of [...runs].reverse()) {
				const runText = newState.doc.textBetween(run.from, run.to)
				const hasOpening = runText.startsWith(delimiter)
				const hasClosing = runText.endsWith(delimiter)
				if (hasOpening && hasClosing) continue

				const target = tr ?? newState.tr
				const delimiterText = newState.schema.text(delimiter, [run.mark])
				if (!hasClosing) target.insert(run.to, delimiterText)
				if (!hasOpening) target.insert(run.from, delimiterText)
				tr = target
			}

			return tr
		},
	})
}
