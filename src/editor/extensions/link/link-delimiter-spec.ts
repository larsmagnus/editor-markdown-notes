import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type { DelimiterSpec } from '@/editor/extensions/formatting/delimiter-spec'
import type { MarkRun } from '@/editor/extensions/formatting/find-mark-runs'
import {
	detectLinkClose,
	linkCloseText,
} from '@/editor/extensions/link/link-close-text'

/**
 * Delimiter recognition/reconstruction for links, for `ensure-delimiters-
 * plugin.ts`: `[` opens, `](href "title")` closes, the latter built from the
 * mark's own `href`/`title` attributes - kept as real schema attributes
 * (unlike bold/strike's, which need none) specifically so this has
 * something to seed fresh delimiter text from, the same role italic's
 * `markup` attribute plays for its own delimiter.
 */
export function linkDelimiterSpec(): DelimiterSpec {
	return {
		detectOpen: (text) => (text.startsWith('[') ? 1 : 0),
		detectClose: detectLinkClose,
		resolveOpen: () => '[',
		resolveClose: (_doc, run) => linkCloseText(hrefOf(run), titleOf(run)),
		isBare: isBareAutolink,
	}
}

function hrefOf(run: MarkRun): string {
	return typeof run.mark.attrs.href === 'string' ? run.mark.attrs.href : ''
}

function titleOf(run: MarkRun): string | null {
	return typeof run.mark.attrs.title === 'string' ? run.mark.attrs.title : null
}

/**
 * A run whose visible text already equals its own `href`, with no title, is
 * an autolink (`<https://example.com>`) - there is nothing for `[`/`](...)`
 * to add, so `ensure-delimiters-plugin.ts` must leave it alone rather than
 * reading its lack of brackets as "missing, please synthesize".
 */
function isBareAutolink(doc: ProseMirrorNode, run: MarkRun): boolean {
	const href = hrefOf(run)
	if (!href || titleOf(run)) return false
	return doc.textBetween(run.from, run.to) === href
}
