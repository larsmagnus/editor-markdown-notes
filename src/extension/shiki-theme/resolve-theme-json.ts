import * as path from 'path'

import { parseJsonc } from '../../lib/jsonc'

/** A VS Code theme JSON body, loosely - only the fields this feature reads. */
export type ThemeJson = {
	include?: string
	colors?: Record<string, unknown>
	tokenColors?: unknown[]
	semanticTokenColors?: Record<string, unknown>
	[key: string]: unknown
}

/** Guards a self-referential or pathologically deep `include` chain. */
const MAX_INCLUDE_DEPTH = 5

/**
 * Reads one theme JSON file and merges in its `include` chain, if it has one.
 *
 * `colors`/`semanticTokenColors` are shallow-merged, override wins per key.
 * `tokenColors` is concatenated base-then-override, which preserves
 * TextMate's own cascade semantics: a rule later in the list wins ties for an
 * equally-specific scope, so appending (not replacing) is what keeps that
 * ordering intact across the two files.
 *
 * Every *other* field is inherited from the base too, `type` above all: VS
 * Code's own themes are include chains that declare it only in the innermost
 * file (`light_modern.json` → `light_plus.json` → `light_vs.json`), and Shiki
 * reads a theme with no `type` as dark.
 *
 * `readFile` is injected rather than called directly against `fs`, so the
 * merge logic is testable without touching disk.
 */
export function resolveThemeJson(
	themePath: string,
	readFile: (filePath: string) => string,
	depth = 0
): ThemeJson {
	const parsed = parseJsonc(readFile(themePath)) as ThemeJson
	const { include, ...rest } = parsed

	if (!include || depth >= MAX_INCLUDE_DEPTH) return rest

	const basePath = path.join(path.dirname(themePath), include)
	const base = resolveThemeJson(basePath, readFile, depth + 1)

	return {
		...base,
		...rest,
		colors: { ...base.colors, ...rest.colors },
		tokenColors: [...(base.tokenColors ?? []), ...(rest.tokenColors ?? [])],
		semanticTokenColors: {
			...base.semanticTokenColors,
			...rest.semanticTokenColors,
		},
	}
}
