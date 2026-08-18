import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import type { Logger } from '../shared/logger'

import { isProbeEnabled } from './probe-enabled'
import { describe } from './reveal-probe-describe'

/**
 * Diagnostic instrumentation for the "reveal a search match" investigation.
 *
 * VSCode's search view opens a result through `vscode.open` with an
 * `ITextEditorOptions.selection`. When the resource resolves to a custom
 * editor, nothing in the documented API surface carries that selection through.
 * This module exists to find out empirically what *is* observable at that
 * moment - every event that fires, in what order, and every property reachable
 * on the objects we are handed, including ones absent from `vscode.d.ts`.
 *
 * Temporary: delete once the investigation lands on a mechanism.
 */

export interface ProbeEvent {
	readonly at: number
	readonly name: string
	readonly data: unknown
}

const events: ProbeEvent[] = []

/** Milliseconds since the probe was installed, so orderings are readable. */
let installedAt = Date.now()

/**
 * Also on disk, not just in the Output channel: the transcript has to be
 * readable from outside the VSCode window that produced it.
 */
const PROBE_LOG_PATH = path.join(os.tmpdir(), 'emn-reveal-probe.log')

export function recordProbe(name: string, data: unknown, log?: Logger) {
	if (!isProbeEnabled()) return

	const event: ProbeEvent = { at: Date.now() - installedAt, name, data }
	events.push(event)

	const line = `[probe +${event.at}ms] ${name} ${describe(data)}`
	log?.info(line)

	try {
		fs.appendFileSync(PROBE_LOG_PATH, `${line}\n`)
	} catch {
		// A probe that breaks the editor when the temp file is unwritable would
		// be worse than a probe that quietly logs to the channel only.
	}
}

/** Everything recorded so far, oldest first. */
export function readProbeEvents(): readonly ProbeEvent[] {
	return events
}

/**
 * Starts a new run, in memory and on disk.
 *
 * The disk marker is not decoration. `installedAt` restarts here while the file
 * only ever grows, so without a boundary the transcript reads as one timeline
 * with timestamps that jump backwards - which is exactly how two unrelated
 * opens were once misread as a first and second click on the same tab.
 */
export function clearProbeEvents() {
	events.length = 0
	installedAt = Date.now()

	if (!isProbeEnabled()) return

	try {
		fs.appendFileSync(
			PROBE_LOG_PATH,
			`\n===== run started ${new Date().toISOString()} =====\n`
		)
	} catch {
		// Same reasoning as recordProbe: never fail on the log.
	}
}
