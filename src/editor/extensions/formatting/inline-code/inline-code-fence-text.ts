import type { DelimiterPair } from '#src/editor/extensions/formatting/delimiter-spec'
import { codeFenceLength } from '#src/editor/extensions/formatting/inline-code/code-fence-length'

/**
 * The literal open/close fence text for wrapping `text` in inline code -
 * plain single backticks when `text` has none of its own, or the shortest
 * unused backtick run (`codeFenceLength`) padded with a space on each side
 * when it does. The padding keeps a fence backtick from visually merging
 * with a backtick at the very start/end of `text` into one longer run,
 * which CommonMark disambiguates with exactly that space.
 */
export function inlineCodeFenceText(text: string): DelimiterPair {
	if (!text.includes('`')) return { open: '`', close: '`' }

	const fence = '`'.repeat(codeFenceLength(text))
	return { open: fence + ' ', close: ' ' + fence }
}
