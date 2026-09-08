import type { Mark, Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

import type { MarkRun } from '#src/editor/extensions/formatting/find-mark-runs'

type MarkBoundary =
	| string
	| ((
			state: MarkdownSerializerState,
			mark: Mark,
			parent: ProseMirrorNode,
			index: number
	  ) => string)

/** `prosemirror-markdown`'s `MarkSerializerSpec`, which it does not export. */
export type DelimiterMarkdownSerialize = {
	open: MarkBoundary
	close: MarkBoundary
	mixable: boolean
	escape: boolean
}

/**
 * How one mark type's delimiter text is recognized and reconstructed. A fixed
 * string covers bold and strike; italic's correct character depends on
 * context and inline code's fence length varies per run, so both bring their
 * own.
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
	/**
	 * True when a run needs no delimiter text at all - an autolink's visible
	 * text already equals its `href`. Distinguishes "none needed" from
	 * `detectOpen`/`detectClose`'s "missing, please synthesize".
	 */
	isBare?(doc: ProseMirrorNode, run: MarkRun): boolean
	/**
	 * True when a delimiter is present but does not currently parse - a URL
	 * mid-retype passes through `](my file.md)`. Read as absent, the repair
	 * pass appends a second delimiter from attributes the edit has not reached,
	 * and the duplicate is permanent: the appended text parses on the next pass
	 * and agrees with those attributes, so nothing takes it back out.
	 */
	isMidEdit?(text: string): boolean
}

/** The literal text to wrap a fresh selection in; inline code's two ends differ. */
export type DelimiterPair = { open: string; close: string }

/** A delimiter that is the same fixed string at both ends. */
export function fixedDelimiter(delimiter: string): DelimiterSpec {
	return {
		detectOpen: (text) => (text.startsWith(delimiter) ? delimiter.length : 0),
		detectClose: (text) => (text.endsWith(delimiter) ? delimiter.length : 0),
		...edgeResolvers(() => delimiter),
	}
}

/** Both edge resolvers from the one computation every spec expresses them as. */
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
 * The serializer every delimited mark shares: its delimiter is already real
 * text carrying the mark, so synthesizing one here would double it up.
 * `escape: false` is load-bearing - the default escaping cannot tell a
 * coincidental delimiter-shaped run in prose from a real one, and would write
 * this mark's own delimiters out escaped, as syntax that stops being a mark on
 * the next load.
 */
export const IDENTITY_DELIMITER_SERIALIZE = {
	open: '',
	close: '',
	mixable: true,
	escape: false,
} as const
