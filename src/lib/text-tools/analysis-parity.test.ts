import dictionaryEn from 'dictionary-en'
import { describe, expect, it } from 'vitest'

import { splitFrontmatter } from '#src/lib/host/frontmatter'
import { getDocumentText } from '#src/lib/text-tools/document-text'
import { getMarkdownSourceText } from '#src/lib/text-tools/markdown-source-text'
import { runPipeline } from '#src/lib/text-tools/run-pipeline'
import type { PipelineOptions } from '#src/lib/text-tools/types'
import { TEXT_TOOL_RULE_IDS } from '#src/shared/messages'
import { createEditor } from '#src/test-utils/editor'

const decoder = new TextDecoder()

const DICTIONARY = {
	aff: decoder.decode(dictionaryEn.aff),
	dic: decoder.decode(dictionaryEn.dic),
}

const OPTIONS: PipelineOptions = {
	rules: [...TEXT_TOOL_RULE_IDS],
	targetAge: 16,
	spellingLanguage: 'en-US',
	dictionary: DICTIONARY,
	ignoreWords: [],
}

/** Built the same way `use-frontmatter-document.ts` builds a real document,
 *  matching `prose-parity.test.ts`'s own harness. */
function documentTextFromMarkdown(markdown: string): string {
	const { frontmatter, body } = splitFrontmatter(markdown)
	const editor = createEditor(body, { parseOnly: true })

	if (frontmatter !== null) {
		editor
			.chain()
			.insertContentAt(0, {
				type: 'frontmatter',
				content: frontmatter ? [{ type: 'text', text: frontmatter }] : [],
			})
			.run()
	}

	return getDocumentText(editor.state.doc).text
}

const FIXTURE_NOTE = `---
title: The report was written was written
---

# Release notes

---

The report was written by the committee. It was very obviously a great and truly wonderful idea.

A reference-style aside[^ref] the editor has no support for.

[^ref]: This footnote definition is not supported and stays literal text.

- We recieved the report.
- Another item.

> A quoted setence with a repeated word word.

We utilize a plethora of methodologies in order to facilitate the aforementioned initiative, which is clearly a very significant undertaking.

Real prose before the code.

\`\`\`js
const utilize = 1
\`\`\`

The report—already late—was rejected—again.
`

/**
 * `document-text.ts` (the editor's ProseMirror walk) and
 * `markdown-source-text.ts` (the raw markdown walk) are two independent
 * implementations that `prose-parity.test.ts` already proves produce
 * identical flattened text. This is what lets the live editor's decorations
 * and the raw editor's highlights run the exact same pipeline on the exact
 * same text and never disagree - proven here at the analysis level, not just
 * the text-extraction level, across headings, lists, a blockquote,
 * frontmatter, a skipped code block, and one flagged instance of each rule
 * family.
 */
describe('text-tools analysis parity', () => {
	it('produces identical results for the editor and the raw markdown source', async () => {
		const pmText = documentTextFromMarkdown(FIXTURE_NOTE)
		const rawText = getMarkdownSourceText(FIXTURE_NOTE).text
		expect(rawText).toBe(pmText)

		const [pmAnalysis, rawAnalysis] = await Promise.all([
			runPipeline(pmText, OPTIONS),
			runPipeline(rawText, OPTIONS),
		])

		// Sanity: the fixture is expected to exercise every rule family, so a
		// change that quietly stops triggering one would not be caught by
		// equality alone (both sides would just as quietly agree on nothing).
		const firedRules = new Set(pmAnalysis.issues.map((issue) => issue.ruleId))
		for (const ruleId of TEXT_TOOL_RULE_IDS) {
			if (ruleId === 'dashOveruse' || ruleId === 'polarity') continue
			expect(firedRules.has(ruleId)).toBe(true)
		}

		expect(rawAnalysis).toEqual(pmAnalysis)
	})
})
