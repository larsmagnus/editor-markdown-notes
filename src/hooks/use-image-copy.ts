import type { ImageAttrs } from '#src/editor/extensions/image/image-markdown-text'
import { imageMarkdownText } from '#src/editor/extensions/image/image-markdown-text'
import { useCopiedFeedback } from '#src/hooks/use-copied-feedback'
import { copyToClipboard } from '#src/lib/clipboard'

/** Copies an image's `![alt](src "title")` to the clipboard, with the same transient feedback every copy button shares. */
export function useImageCopy(attrs: ImageAttrs) {
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	function copy() {
		copyToClipboard(imageMarkdownText(attrs))
		showCopiedFeedback()
	}

	return [copied, copy] as const
}
