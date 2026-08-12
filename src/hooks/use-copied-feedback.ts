import { useState } from 'react'
import { useTimeout } from 'usehooks-ts'

const DEFAULT_DURATION_MS = 1500

/**
 * A boolean that flips true for `durationMs` after `show()` is called, then
 * resets on its own - the transient "Copied" badge after a clipboard write.
 *
 * `useTimeout` only reschedules when the delay it's given changes, so calling
 * `show()` again while already showing is a no-op: `copied` is already true,
 * so the delay passed in doesn't change, and the badge hides on the original
 * schedule rather than getting a fresh `durationMs`. Acceptable for a
 * transient badge - not worth the extra state a real restart would need.
 */
export function useCopiedFeedback(durationMs = DEFAULT_DURATION_MS) {
	const [copied, setCopied] = useState(false)

	useTimeout(() => setCopied(false), copied ? durationMs : null)

	function show() {
		setCopied(true)
	}

	return [copied, show] as const
}
