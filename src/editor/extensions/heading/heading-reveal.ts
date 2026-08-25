import { headingMarkerLength } from '@/editor/extensions/heading/heading-marker'
import type { FenceRange } from '@/editor/extensions/syntax-reveal/create-fence-reveal-provider'

/**
 * Adapts a heading's marker into the shape `createFenceRevealProvider`
 * shares across every construct whose syntax is real leading text - a
 * heading has no closing counterpart the way a fenced block does, so
 * `hasClosingFence` is always `false`.
 */
export function parseHeadingReveal(text: string): FenceRange {
	return {
		codeFrom: headingMarkerLength(text),
		codeTo: text.length,
		hasClosingFence: false,
	}
}
