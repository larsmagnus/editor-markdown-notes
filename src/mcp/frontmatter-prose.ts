import { frontmatterValueOf } from '@/lib/text-tools/prose-policy'

/**
 * One run of prose per frontmatter line, with where each sits in the file.
 *
 * A `title:`/`description:` field can hold real prose worth checking, but
 * retext has no concept of YAML's line-based `key: value` structure - fed the
 * whole multi-line block as a single run, it finds no sentence-ending
 * punctuation between lines and scores five unrelated lines as one giant
 * run-on sentence. One run per line gives each its own sentence boundary
 * instead, matching how `document-text.ts` treats the same block.
 */
export function frontmatterRuns(frontmatter: string, base: number) {
	const runs: { text: string; source: number }[] = []
	let offset = 0

	for (const line of frontmatter.split('\n')) {
		const value = frontmatterValueOf(line)
		if (value.text) {
			runs.push({ text: value.text, source: base + offset + value.start })
		}
		offset += line.length + 1
	}

	return runs
}
