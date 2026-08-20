import { useCopiedFeedback } from '@/hooks/use-copied-feedback'
import { copyToClipboard } from '@/lib/clipboard'

/** Copies `text` to the clipboard on demand, alongside `useCopiedFeedback`'s transient acknowledgement. */
export function useCopyToClipboard(text: string) {
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	function handleCopy() {
		copyToClipboard(text)
		showCopiedFeedback()
	}

	return [copied, handleCopy] as const
}
