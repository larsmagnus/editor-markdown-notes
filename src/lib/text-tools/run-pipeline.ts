import retextEnglish from 'retext-english'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import { readabilityIssues } from '@/lib/text-tools/readability-issues'
import { spellingIssues } from '@/lib/text-tools/spelling-issues'
import type { Analysis, PipelineOptions } from '@/lib/text-tools/types'
import { wordIssues } from '@/lib/text-tools/word-issues'

/**
 * The analysis itself, kept free of any worker plumbing so the tests can drive
 * it directly - Vitest cannot start the inline blob worker under happy-dom.
 *
 * This module and the ones it runs statically import the whole retext stack
 * (~45kB gzipped), which is why nothing on the main thread may import any of
 * them: they are pulled in only by `analyze.worker.ts`, whose source Vite
 * inlines into the lazily-loaded `analyze-client` chunk.
 */
export async function runPipeline(
	text: string,
	options: PipelineOptions
): Promise<Analysis> {
	const enabled = new Set(options.rules)
	const file = new VFile(text)

	// Parsed once and handed to every pass; none of them mutates the tree.
	const tree = unified().use(retextEnglish).parse(file)

	let sentenceCount = 0
	visit(tree, 'SentenceNode', () => {
		sentenceCount += 1
	})

	const readability = enabled.has('readability')
		? await readabilityIssues(tree, text, options.targetAge)
		: []

	const spelling = enabled.has('spelling')
		? await spellingIssues(tree, text, {
				language: options.spellingLanguage,
				dictionary: options.dictionary,
				ignoreWords: options.ignoreWords,
			})
		: []

	const issues = [
		...(await wordIssues(tree, text, enabled)),
		...readability,
		...spelling,
	]
	issues.sort((a, b) => a.start - b.start)

	return { issues, sentenceCount }
}
