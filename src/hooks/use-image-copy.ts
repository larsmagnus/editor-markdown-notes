import type { ImageAttrs } from '@/editor/extensions/image/image-markdown-text'
import { imageMarkdownText } from '@/editor/extensions/image/image-markdown-text'
import { useCopiedFeedback } from '@/hooks/use-copied-feedback'
import { copyToClipboard } from '@/lib/clipboard'

/** Copies an image's `![alt](src "title")` to the clipboard, with the same transient feedback every copy button shares. */
export function useImageCopy(attrs: ImageAttrs) {
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	function copy() {
		copyToClipboard(imageMarkdownText(attrs))
		showCopiedFeedback()
	}

	return [copied, copy] as const
}
