/**
 * Claude Code code complexity hook (PostToolUse)
 * Warns when an edited file has grown too complex (via fta-cli),
 * so it can be improved before complexity compounds further.
 *
 * @example Wiring it up in `.claude/settings.local.json`:
 *
 * {
 *   "hooks": {
 *     "PostToolUse": [
 *       {
 *         "matcher": "Edit|Write",
 *         "hooks": [
 *           { "type": "command", "command": "node --no-warnings scripts/check-complexity.ts" }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * Claude Code pipes the tool-call payload (including the edited file's path)
 * into the command's stdin.
 *
 * @example Overriding the score cap via `-s`/`--score-cap`
 * `node --no-warnings check-complexity.ts --score-cap 70`
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { runFta } from 'fta-cli'
import type { AnalyzedFile } from 'fta-cli'
import { z } from 'zod'

/**
 * Last-resort cap, used only when `fta.json` is missing. That file is the source
 * of truth for both this hook and `pnpm complexity`.
 */
const DEFAULT_SCORE_CAP = 50

const CONFIG_PATH = join(import.meta.dirname, '..', 'fta.json')

// Claude Code's PostToolUse payload - only the edited file's path matters here.
const payloadSchema = z.object({
	tool_input: z.object({ file_path: z.string() }),
})

/**
 * The subset of fta's config this hook honours. Strict on purpose: fta itself
 * parses `fta.json` with `unwrap_or_default()` and serde ignores unknown fields,
 * so a typo like `score_cop` silently reverts the cap to fta's default of 1000
 * and CI goes green enforcing nothing. Throwing here is the only place that
 * mistake becomes visible.
 */
const configSchema = z.strictObject({
	score_cap: z.number().optional(),
	exclude_directories: z.array(z.string()).optional(),
})

function readConfig(): z.infer<typeof configSchema> {
	if (!existsSync(CONFIG_PATH)) return {}
	return configSchema.parse(JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')))
}

// Mirrors fta-cli's own `-s, --score-cap` flag so both tools share one vocabulary.
function parseScoreCap(argv: string[]): number | undefined {
	const flagIndex = argv.findIndex(
		(arg) => arg === '--score-cap' || arg === '-s'
	)
	if (flagIndex === -1) return undefined

	const value = Number(argv[flagIndex + 1])
	return Number.isFinite(value) ? value : undefined
}

/**
 * Whether `fta.json` excludes this file. `runFta` only ever forwards `--json` to
 * the binary, so the config never reaches it on the hook path - without this the
 * hook would nag on every vendored `src/components/ui/**` edit, telling Claude to
 * simplify a file the repo rules forbid touching.
 *
 * fta resolves its exclusions against the analysed root, which `pnpm complexity`
 * sets to `src`, hence the `src` prefix added back here.
 */
function isExcluded(filePath: string, excluded: string[]): boolean {
	return excluded.some((directory) =>
		filePath.includes(join('src', directory) + '/')
	)
}

// Any failure here (no stdin, malformed JSON, unexpected shape) just means
// there's nothing to check - fail open rather than crash the hook.
function readFilePathFromStdin(): string | undefined {
	try {
		const raw = readFileSync(0, 'utf-8')
		const parsed = payloadSchema.safeParse(JSON.parse(raw))
		return parsed.success ? parsed.data.tool_input.file_path : undefined
	} catch {
		return undefined
	}
}

const config = readConfig()
const scoreCap =
	parseScoreCap(process.argv.slice(2)) ?? config.score_cap ?? DEFAULT_SCORE_CAP
const filePath = readFilePathFromStdin()

if (!filePath || !existsSync(filePath)) {
	process.exit(0)
}

if (isExcluded(filePath, config.exclude_directories ?? [])) {
	process.exit(0)
}

let results: AnalyzedFile[]
try {
	// fta returns `[]` for unsupported file types (e.g. markdown, css) - not an error.
	results = JSON.parse(runFta(filePath, { json: true }))
} catch {
	process.exit(0)
}

const result = results[0]
if (!result || result.fta_score <= scoreCap) {
	process.exit(0)
}

// Exit code 2 is what surfaces this stderr message back to Claude as feedback.
console.error(
	`Complexity check: ${filePath} scored ${result.fta_score.toFixed(1)} (${result.assessment}, ${result.line_count} lines) — above the cap of ${scoreCap}.\n` +
		'Simplify the implementation or extract smaller modules before continuing.'
)
process.exit(2)
