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
 * @example Overriding the default score cap (50) via `-s`/`--score-cap`
 * `node --no-warnings check-complexity.ts --score-cap 70`
 */
import { existsSync, readFileSync } from 'node:fs'

import { runFta } from 'fta-cli'
import type { AnalyzedFile } from 'fta-cli'
import { z } from 'zod'

const DEFAULT_SCORE_CAP = 50

// Claude Code's PostToolUse payload - only the edited file's path matters here.
const payloadSchema = z.object({
	tool_input: z.object({ file_path: z.string() }),
})

// Mirrors fta-cli's own `-s, --score-cap` flag so both tools share one vocabulary.
function parseScoreCap(argv: string[]): number {
	const flagIndex = argv.findIndex(
		(arg) => arg === '--score-cap' || arg === '-s'
	)
	if (flagIndex === -1) return DEFAULT_SCORE_CAP

	const value = Number(argv[flagIndex + 1])
	return Number.isFinite(value) ? value : DEFAULT_SCORE_CAP
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

const scoreCap = parseScoreCap(process.argv.slice(2))
const filePath = readFilePathFromStdin()

if (!filePath || !existsSync(filePath)) {
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
