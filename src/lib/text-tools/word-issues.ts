import type { Root } from 'nlcst'
import retextEnglish from 'retext-english'
import retextIntensify from 'retext-intensify'
import retextPassive from 'retext-passive'
import retextSimplify from 'retext-simplify'
import type { Plugin } from 'unified'
import { unified } from 'unified'
import { VFile } from 'vfile'

import type { TextIssue } from '@/lib/text-tools/types'
import { toIssue } from '@/lib/text-tools/vfile-message-to-issue'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * The plugin behind each rule. Keyed by `TextToolRuleId`, so a new rule does not
 * compile until it is listed here.
 *
 * Readability and spelling are excluded because each needs a processor of its
 * own - readability is run twice with different options, and the speller's is
 * cached across runs.
 */
const RULE_PLUGINS: Record<
	Exclude<TextToolRuleId, 'readability' | 'spelling'>,
	Plugin<[], Root>
> = {
	passive: retextPassive,
	simplify: retextSimplify,
	intensify: retextIntensify,
}

/** The word-level rules, run together over one shared parse. */
export async function wordIssues(
	tree: Root,
	text: string,
	enabled: Set<TextToolRuleId>
): Promise<TextIssue[]> {
	const plugins = Object.entries(RULE_PLUGINS).filter(([ruleId]) =>
		enabled.has(ruleId as TextToolRuleId)
	)
	if (plugins.length === 0) return []

	const processor = unified().use(retextEnglish)
	for (const [, plugin] of plugins) processor.use(plugin)

	const file = new VFile(text)
	await processor.run(tree, file)

	return file.messages.flatMap((message) => {
		const issue = toIssue(message, 'warning')

		return issue ? [issue] : []
	})
}
