/**
 * Every property that decides where a line of raw markdown wraps, shared by
 * the textarea and the layers drawn behind it - the colored mirror and the
 * line-number gutter. They must lay text out identically, or a click lands on
 * a different character than the one shown there and a deleted selection
 * takes other text with it.
 *
 * Spelled out rather than left to defaults because the defaults differ: a
 * textarea breaks an over-long word (`overflow-wrap: break-word`) where a
 * `<pre>` lets it run on, so a long URL wrapped in one layer only and every
 * line below it drifted.
 */
export const RAW_TEXT_LAYOUT =
	'm-0 border-none p-0 font-mono text-sm whitespace-pre-wrap [overflow-wrap:break-word] [word-break:normal] [tab-size:4] [font-variant-ligatures:none]'
