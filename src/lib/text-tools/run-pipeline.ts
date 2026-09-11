import retextEnglish from 'retext-english'
import retextSyntaxUrls from 'retext-syntax-urls'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import { dashOveruseIssues } from '#src/lib/text-tools/dash-overuse-issues'
import { polarityIssues } from '#src/lib/text-tools/polarity-issues'
import { readabilityIssues } from '#src/lib/text-tools/readability-issues'
import { spellingIssues } from '#src/lib/text-tools/spelling-issues'
import type { Analysis, PipelineOptions } from '#src/lib/text-tools/types'
import { wordIssues } from '#src/lib/text-tools/word-issues'

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

	// `retextSyntaxUrls` registers a parser extension rather than a tree
	// transform - it only takes effect on the processor that calls `.parse()`,
	// so it has to sit on this one parse rather than a later `.run()`. Every
	// other pass below shares the resulting tree, already URL-aware, without
	// needing the plugin themselves.
	const tree = unified().use(retextEnglish).use(retextSyntaxUrls).parse(file)

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

	const polarity = enabled.has('polarity') ? polarityIssues(tree) : null
	const dashOveruse = enabled.has('dashOveruse')
		? dashOveruseIssues(tree, sentenceCount)
		: null

	const issues = [
		...(await wordIssues(tree, text, enabled)),
		...readability,
		...spelling,
		...(polarity?.issues ?? []),
		...(dashOveruse?.issues ?? []),
	]
	issues.sort((a, b) => a.start - b.start)

	return {
		issues,
		sentenceCount,
		polarity: polarity?.temperature ?? null,
		dashOveruse: dashOveruse?.summary ?? null,
	}
}
