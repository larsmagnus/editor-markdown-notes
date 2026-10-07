import { z } from 'zod'

export type CorpusSample = {
	name: string
	markdown: string
}

const SpecExamplesSchema = z.array(
	z.object({
		markdown: z.string(),
		example: z.number(),
		section: z.string(),
	})
)

const adversarialFiles = import.meta.glob<string>(
	'/fixtures/markdown/adversarial/*.md',
	{ query: '?raw', import: 'default', eager: true }
)

const specFiles = import.meta.glob<unknown>('/fixtures/markdown/*.json', {
	import: 'default',
	eager: true,
})

/** The hand-built adversarial notes, one per category of malformed input. */
export function adversarialCorpus(): CorpusSample[] {
	return Object.entries(adversarialFiles).map(([path, markdown]) => ({
		name: path.split('/').at(-1) ?? path,
		markdown,
	}))
}

/** Every example in one vendored spec, named by section and number. */
function specExamples(fileName: string): CorpusSample[] {
	const examples = SpecExamplesSchema.parse(
		specFiles[`/fixtures/markdown/${fileName}`]
	)
	return examples.map(({ markdown, example, section }) => ({
		name: `${section} #${example}`,
		markdown,
	}))
}

/** CommonMark 0.31.2's spec examples. */
export function commonmarkExamples(): CorpusSample[] {
	return specExamples('commonmark-spec.json')
}

/** GFM's extension examples (tables, strikethrough, autolinks, task lists). */
export function gfmExamples(): CorpusSample[] {
	return specExamples('gfm-spec.json')
}
