import AnalyzeWorker from '@/lib/text-tools/analyze.worker.ts?worker&inline'
import type {
	Analysis,
	AnalyzeRequest,
	AnalyzeResponse,
} from '@/lib/text-tools/types'
import type { TextToolRuleId } from '@/shared/messages'

/**
 * Owns the analysis worker. Only ever reached through `await import()`, which
 * is what keeps the retext stack out of the entry chunk.
 *
 * `?worker&inline` rather than a plain worker URL: Vite would otherwise emit a
 * URL relative to the entry chunk, which under a webview resolves to the
 * `vscode-cdn.net` resource host - a different origin from the
 * `vscode-webview://` document, and a worker must be same-origin. Inlining
 * boots it from a blob URL instead, which inherits the document's origin. That
 * blob is why the host's CSP carries `worker-src blob:`.
 */
export type Analyzer = {
	analyze: (
		text: string,
		rules: TextToolRuleId[],
		targetAge: number
	) => Promise<Analysis>
	dispose: () => void
}

type Pending = {
	resolve: (analysis: Analysis) => void
	reject: (error: Error) => void
}

export function createAnalyzer(): Analyzer {
	const worker = new AnalyzeWorker()
	const pending = new Map<number, Pending>()
	let lastId = 0

	worker.addEventListener('message', (event: MessageEvent<AnalyzeResponse>) => {
		const response = event.data
		const entry = pending.get(response.id)
		if (!entry) return

		pending.delete(response.id)

		if (!response.ok) {
			entry.reject(new Error(response.error))
			return
		}

		const { id: _id, ok: _ok, ...analysis } = response
		entry.resolve(analysis)
	})

	// A worker that dies outright - an import that fails, an out-of-memory kill -
	// never replies to anything, so every waiting request has to be failed here
	// or the panel hangs on "Checking…".
	worker.addEventListener('error', (event: ErrorEvent) => {
		const error = new Error(event.message || 'The analysis worker failed')
		for (const entry of pending.values()) entry.reject(error)
		pending.clear()
	})

	const analyze = (
		text: string,
		rules: TextToolRuleId[],
		targetAge: number
	) => {
		lastId += 1
		const request: AnalyzeRequest = { id: lastId, text, rules, targetAge }

		return new Promise<Analysis>((resolve, reject) => {
			pending.set(request.id, { resolve, reject })
			worker.postMessage(request)
		})
	}

	const dispose = () => {
		// Anything still in flight is abandoned rather than resolved: the caller
		// is unmounting, and a pending promise that never settles is collected
		// with the closure.
		pending.clear()
		worker.terminate()
	}

	return { analyze, dispose }
}
