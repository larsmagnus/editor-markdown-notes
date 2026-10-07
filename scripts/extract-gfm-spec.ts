// Keeps only GFM's extension examples: the CommonMark ones are vendored
// straight from spec.commonmark.org, which publishes JSON where GFM only
// publishes the annotated text. Run by hand when GFM revises its spec.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FENCE = '`'.repeat(32)
const EXAMPLE_OPEN = new RegExp(`^${FENCE} example (\\w+)$`)

type GfmExample = {
	markdown: string
	html: string
	example: number
	section: string
	extension: string
}

/** The spec writes tabs as `→` so they survive being read on a page. */
function untab(text: string): string {
	return text.replaceAll('→', '\t')
}

/** Every extension example in `spec`, numbered in order of appearance. */
function extractExtensionExamples(spec: string): GfmExample[] {
	const lines = spec.split('\n')
	const examples: GfmExample[] = []
	let section = ''

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index]
		if (line.startsWith('#')) section = line.replace(/^#+\s*/, '').trim()

		const open = EXAMPLE_OPEN.exec(line)
		if (!open) continue

		const close = lines.indexOf(FENCE, index)
		const body = lines.slice(index + 1, close)
		const divider = body.indexOf('.')
		examples.push({
			markdown: untab(
				body
					.slice(0, divider)
					.map((l) => `${l}\n`)
					.join('')
			),
			html: untab(
				body
					.slice(divider + 1)
					.map((l) => `${l}\n`)
					.join('')
			),
			example: examples.length + 1,
			section,
			extension: open[1],
		})
		index = close
	}

	return examples
}

const specPath = process.argv[2]
if (!specPath) throw new Error('Usage: extract-gfm-spec.ts <spec.txt>')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const examples = extractExtensionExamples(readFileSync(specPath, 'utf8'))

writeFileSync(
	join(root, 'fixtures/markdown/gfm-spec.json'),
	`${JSON.stringify(examples, null, '\t')}\n`
)
console.log(`Wrote ${examples.length} GFM extension examples`)
