/**
 * Claude Code duplication hook (PostToolUse)
 * Warns when the edited file shares a duplicated block with another file
 * (via jscpd), so near-identical code can be extracted before it spreads
 * further.
 *
 * @example Wiring it up in `.claude/settings.local.json`:
 *
 * {
 *   "hooks": {
 *     "PostToolUse": [
 *       {
 *         "matcher": "Edit|Write",
 *         "hooks": [
 *           { "type": "command", "command": "node --no-warnings scripts/check-duplication.ts" }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * Claude Code pipes the tool-call payload (including the edited file's path)
 * into the command's stdin. `.jscpd.json` is the source of truth for what
 * gets scanned and ignored - this hook re-scans the whole project (jscpd's
 * own native binary does this in ~20-30ms) rather than re-implementing its
 * ignore rules, and simply filters the report for clones touching the
 * edited file.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

import { z } from 'zod'

const ROOT = join(import.meta.dirname, '..')

const payloadSchema = z.object({
	tool_input: z.object({ file_path: z.string() }),
})

const cloneLocationSchema = z.object({
	name: z.string(),
	startLoc: z.object({ line: z.number() }),
	endLoc: z.object({ line: z.number() }),
})

const reportSchema = z.object({
	duplicates: z.array(
		z.object({
			firstFile: cloneLocationSchema,
			secondFile: cloneLocationSchema,
		})
	),
})

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

function describeClone(
	other: z.infer<typeof cloneLocationSchema>,
	edited: z.infer<typeof cloneLocationSchema>
): string {
	return `${edited.name}:${edited.startLoc.line}-${edited.endLoc.line} duplicates ${other.name}:${other.startLoc.line}-${other.endLoc.line}`
}

const filePath = readFilePathFromStdin()
if (!filePath || !existsSync(filePath)) {
	process.exit(0)
}

// jscpd reports clone locations relative to `.jscpd.json`'s scan root (`src`).
const relativeToScanRoot = relative(join(ROOT, 'src'), resolve(filePath))

const outDir = mkdtempSync(join(tmpdir(), 'jscpd-hook-'))
try {
	// Resolved through Node's own module system rather than a hardcoded
	// `node_modules/.bin/jscpd` path, so this keeps working regardless of how
	// the package manager lays out `.bin` (npm, yarn, pnpm workspaces, ...).
	// jscpd v5 has no Node API to import instead - it ships this launcher
	// script as its only entry point, which execs a platform-specific native
	// binary. Resolved inside the try so a missing install falls through to
	// the same fail-open catch below, rather than crashing the hook.
	const jscpdBin = createRequire(import.meta.url).resolve('jscpd/run-jscpd.js')

	execFileSync(
		process.execPath,
		[jscpdBin, '-c', '.jscpd.json', '-r', 'json', '-o', outDir],
		{ cwd: ROOT, stdio: 'ignore' }
	)

	const report = reportSchema.parse(
		JSON.parse(readFileSync(join(outDir, 'jscpd-report.json'), 'utf-8'))
	)

	const messages = report.duplicates.flatMap(({ firstFile, secondFile }) => {
		if (firstFile.name === relativeToScanRoot)
			return [describeClone(secondFile, firstFile)]
		if (secondFile.name === relativeToScanRoot)
			return [describeClone(firstFile, secondFile)]
		return []
	})

	if (messages.length === 0) process.exit(0)

	// Exit code 2 is what surfaces this stderr message back to Claude as feedback.
	console.error(
		`Duplication check found ${messages.length} clone(s) involving ${filePath}:\n` +
			messages.map((message) => `  - ${message}`).join('\n') +
			'\nExtract the shared code into a function, or leave it if the repeat is unavoidable boilerplate.'
	)
	process.exit(2)
} catch {
	// jscpd not installed, report missing, or scan failed - nothing to check.
	process.exit(0)
} finally {
	rmSync(outDir, { recursive: true, force: true })
}
