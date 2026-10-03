import { copyDrawioSvgAsMermaid } from '#src/editor/extensions/image/drawio/actions'
import { isLocalDrawioSvg } from '#src/editor/extensions/image/drawio/is-local-drawio-svg'
import { useCopiedFeedback } from '#src/hooks/use-copied-feedback'

/**
 * Copies a local draw.io image's diagram as mermaid, with the shared transient
 * feedback. `undefined` for any other image, so the toolbar can leave the
 * control out rather than offering one that can only fail.
 */
export function useImageCopyAsMermaid(src: string, resolvedSrc: string) {
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	if (!isLocalDrawioSvg(src)) return undefined
	return {
		copied,
		onCopy: () => copyDrawioSvgAsMermaid(resolvedSrc, showCopiedFeedback),
	}
}
