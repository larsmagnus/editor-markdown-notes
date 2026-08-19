/// <reference lib="webworker" />

import { runPipeline } from '@/lib/text-tools/run-pipeline'
import type { AnalyzeRequest, AnalyzeResponse } from '@/lib/text-tools/types'

/**
 * The analysis runs here so a long note does not stall typing - a 8,000-word
 * document takes ~200ms, which is a visible hitch on the main thread.
 *
 * The `reference lib` above pulls in the worker globals for this file only;
 * `declare const self` then shadows the DOM `Window` the rest of the app is
 * typed against. All the real work lives in `run-pipeline.ts` so it stays
 * testable without starting a worker.
 */
declare const self: DedicatedWorkerGlobalScope

self.addEventListener(
	'message',
	async (event: MessageEvent<AnalyzeRequest>) => {
		const { id, text, ...options } = event.data

		// Every path has to post something back: the client resolves on the
		// reply, so a request that produces none never settles and the panel
		// sits on "Checking…" for the rest of the session.
		try {
			const analysis = await runPipeline(text, options)
			const response: AnalyzeResponse = { id, ok: true, ...analysis }
			self.postMessage(response)
		} catch (error) {
			const response: AnalyzeResponse = {
				id,
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			}
			self.postMessage(response)
		}
	}
)
