import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'

/**
 * How `ensure-delimiters-plugin.ts` and the backspace/delete boundary
 * commands recognize and reconstruct one mark type's delimiter text. A fixed
 * string (bold's `**`, strike's `~~`) is the simple case (`fixedDelimiter`);
 * italic needs its own implementation (`italic-delimiter-spec.ts`) since
 * which character is correct depends on context, and inline code needs its
 * own (`inline-code-delimiter-spec.ts`) since the fence length itself varies
 * per run - neither can be reduced to one fixed-length string.
 */
export type DelimiterSpec = {
	/** Length of the delimiter already at the very start of `text`, or 0 if there is none. */
	detectOpen(text: string): number
	/** Length of the delimiter already at the very end of `text`, or 0 if there is none. */
	detectClose(text: string): number
	/** The delimiter text to insert at the run's start when it has none. */
	resolveOpen(doc: ProseMirrorNode, run: MarkRun): string
	/** The delimiter text to insert at the run's end when it has none. */
	resolveClose(doc: ProseMirrorNode, run: MarkRun): string
}

/**
 * The literal text to wrap a fresh selection in - separate open/close since
 * inline code's fence sometimes needs an asymmetric padding space (see
 * `inline-code-delimiter-spec.ts`); bold/strike/italic just use the same
 * string both ways.
 */
export type DelimiterPair = { open: string; close: string }

export function fixedDelimiter(delimiter: string): DelimiterSpec {
	return {
		detectOpen: (text) => (text.startsWith(delimiter) ? delimiter.length : 0),
		detectClose: (text) => (text.endsWith(delimiter) ? delimiter.length : 0),
		...edgeResolvers(() => delimiter),
	}
}

/**
 * `resolveOpen`/`resolveClose` are always the same one-edge computation
 * called with `'open'`/`'close'` - italic's and inline code's own specs
 * both need that computation to resolve the run's document context (via
 * `doc`/`run`), so this is the shared shape, not the resolution logic
 * itself.
 */
export function edgeResolvers(
	resolve: (
		doc: ProseMirrorNode,
		run: MarkRun,
		edge: 'open' | 'close'
	) => string
): Pick<DelimiterSpec, 'resolveOpen' | 'resolveClose'> {
	return {
		resolveOpen: (doc, run) => resolve(doc, run, 'open'),
		resolveClose: (doc, run) => resolve(doc, run, 'close'),
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
