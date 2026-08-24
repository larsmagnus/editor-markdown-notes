import type { FenceRange } from '@/editor/extensions/syntax-reveal/create-fence-reveal-provider'
import { findClosingFence } from '@/editor/extensions/syntax-reveal/find-closing-fence'

/**
 * A frontmatter block's own text, split into its `---` fence lines and the
 * YAML between them - mirrors `code-fence.ts`, minus a language tag, since
 * the fence marker here is always the literal `---`. Field names match
 * `FenceRange` (`codeFrom`/`codeTo`, not `yamlFrom`/`yamlTo`) so this parser
 * plugs directly into the shared `createFenceRevealProvider`.
 */
export type ParsedFrontmatterFence = FenceRange

const OPEN_FENCE = /^---\n?/

/**
 * Parses a frontmatter block's literal text (fence lines included) into its
 * YAML range. Tolerant of mid-edit states: no closing fence yet, or an empty
 * block.
 */
export function parseFrontmatterFence(text: string): ParsedFrontmatterFence {
	const open = OPEN_FENCE.exec(text)

	if (!open) {
		return { codeFrom: 0, codeTo: text.length, hasClosingFence: false }
	}

	const codeFrom = open[0].length
	const rest = text.slice(codeFrom)
	const closeIndex = findClosingFence(rest, '---')

	if (closeIndex === null) {
		return { codeFrom, codeTo: text.length, hasClosingFence: false }
	}

	return { codeFrom, codeTo: codeFrom + closeIndex, hasClosingFence: true }
}

/** The block's YAML, fence lines stripped. `''` for a block with no fence yet. */
export function frontmatterYaml(text: string): string {
	const { codeFrom, codeTo } = parseFrontmatterFence(text)
	return text.slice(codeFrom, codeTo)
}

/**
 * Builds a block's full literal text (fence lines included) from its YAML -
 * no blank line between the fences for empty YAML, so a block parsed from an
 * originally-empty `---\n---` round-trips back to the exact same bytes.
 */
export function frontmatterFenceText(yaml: string): string {
	return yaml ? `---\n${yaml}\n---` : '---\n---'
}
