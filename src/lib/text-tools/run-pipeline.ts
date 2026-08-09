import retextEnglish from 'retext-english'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import { readabilityIssues } from '@/lib/text-tools/readability-issues'
import type { Analysis } from '@/lib/text-tools/types'
import { wordIssues } from '@/lib/text-tools/word-issues'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * The analysis itself, kept free of any worker plumbing so the tests can drive
 * it directly - Vitest cannot start the inline blob worker under happy-dom.
 *
 * This module and the two it runs statically import the whole retext stack
 * (~45kB gzipped), which is why nothing on the main thread may import any of
 * them: they are pulled in only by `analyze.worker.ts`, whose source Vite
 * inlines into the lazily-loaded `analyze-client` chunk.
 */
export async function runPipeline(
	text: string,
	rules: TextToolRuleId[],
	targetAge: number
): Promise<Analysis> {
	const enabled = new Set(rules)
	const file = new VFile(text)

	// Parsed once and handed to both passes; neither mutates the tree.
	const tree = unified().use(retextEnglish).parse(file)

	let sentenceCount = 0
	visit(tree, 'SentenceNode', () => {
		sentenceCount += 1
	})

	const readability = enabled.has('readability')
		? await readabilityIssues(tree, text, targetAge)
		: []

	const issues = [...(await wordIssues(tree, text, enabled)), ...readability]
	issues.sort((a, b) => a.start - b.start)

	return { issues, sentenceCount }
}
