import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * How `ensure-delimiters-plugin.ts` recognizes and reconstructs one mark
 * type's delimiter text. A fixed string (bold's `**`, strike's `~~`) is the
 * simple case (`fixedDelimiter`); italic needs its own implementation
 * (`italic-delimiter-spec.ts`) since which character is correct depends on
 * the run's own context, not a constant.
 */
export type DelimiterSpec = {
	/** Character length of the delimiter at each edge - always the same both sides. */
	length: number
	/** Whether `candidate` (a `length`-character slice of the run's own text) is a valid delimiter. */
	matches(candidate: string): boolean
	/** The delimiter text to insert at the run's start when it has none. */
	resolveOpen(doc: ProseMirrorNode, run: MarkRun): string
	/** The delimiter text to insert at the run's end when it has none. */
	resolveClose(doc: ProseMirrorNode, run: MarkRun): string
}

export function fixedDelimiter(delimiter: string): DelimiterSpec {
	return {
		length: delimiter.length,
		matches: (candidate) => candidate === delimiter,
		resolveOpen: () => delimiter,
		resolveClose: () => delimiter,
	}
}

/**
 * The `markdown` serializer side every delimited mark shares: the delimiter
 * is already real text carrying the mark (see `wrap-selection-with-
 * delimiter.ts`), so there's nothing left to synthesize here, or it would
 * double up. `escape: false` is load-bearing, not cosmetic -
 * `prosemirror-markdown`'s default escaping has no way to tell a
 * coincidental delimiter-shaped run in plain prose apart from a real one,
 * and would otherwise write this mark's own delimiters back out escaped -
 * syntax that silently stops being a mark on the next load.
 */
export const IDENTITY_DELIMITER_SERIALIZE = {
	open: '',
	close: '',
	mixable: true,
	escape: false,
} as const
