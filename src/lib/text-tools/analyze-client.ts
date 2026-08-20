import AnalyzeWorker from '@/lib/text-tools/analyze.worker.ts?worker&inline'
import type {
	Analysis,
	AnalyzeRequest,
	AnalyzeResponse,
	PipelineOptions,
} from '@/lib/text-tools/types'
import type { SpellingLanguage } from '@/shared/messages'

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
	/**
	 * `options.dictionary` is the fully-loaded language, handed over on every
	 * call - deciding when the worker actually needs the bytes is this module's
	 * job, not the caller's.
	 */
	analyze: (text: string, options: PipelineOptions) => Promise<Analysis>
	dispose: () => void
}

type Pending = {
	resolve: (analysis: Analysis) => void
	reject: (error: Error) => void
	language: SpellingLanguage
	/** Whether this request sent the dictionary - only then does a successful
	 *  response mean the worker actually cached it. */
	dictionarySent: boolean
}

export function createAnalyzer(): Analyzer {
	const worker = new AnalyzeWorker()
	const pending = new Map<number, Pending>()
	let lastId = 0

	// Which languages the worker has been given, so the ~575kB payload is cloned
	// once each rather than on every keystroke. A set, not the last one sent:
	// the worker caches every language it builds, so switching away and back
	// must not re-send. Safe because this module owns the worker outright - a
	// replaced worker comes with a fresh analyzer, and so a fresh record.
	const sentLanguages = new Set<SpellingLanguage>()

	worker.addEventListener('message', (event: MessageEvent<AnalyzeResponse>) => {
		const response = event.data
		const entry = pending.get(response.id)
		if (!entry) return

		pending.delete(response.id)

		if (!response.ok) {
			entry.reject(new Error(response.error))
			return
		}

		if (entry.dictionarySent) sentLanguages.add(entry.language)

		const { id: _id, ok: _ok, ...analysis } = response
		entry.resolve(analysis)
	})

	// A worker that dies outright - an import that fails, an out-of-memory kill -
	// never replies to anything, so every waiting request has to be failed here
	// or the panel hangs on "Checking…".
	worker.addEventListener('error', (event: ErrorEvent) => {
		// Whatever the worker had cached died with it.
		sentLanguages.clear()
		const error = new Error(event.message || 'The analysis worker failed')
		for (const entry of pending.values()) entry.reject(error)
		pending.clear()
	})

	const analyze = (text: string, options: PipelineOptions) => {
		lastId += 1

		// Gated on the rule, not just on holding the bytes: the worker only
		// caches a dictionary inside the spelling pass, which it skips when the
		// rule is off. Recording one it discarded would leave the next run that
		// does want spelling sending nothing, and the worker throwing for the
		// rest of the session.
		const isWanted = options.rules.includes('spelling')
		const dictionary =
			isWanted && !sentLanguages.has(options.spellingLanguage)
				? options.dictionary
				: undefined

		const request: AnalyzeRequest = { id: lastId, text, ...options, dictionary }

		return new Promise<Analysis>((resolve, reject) => {
			pending.set(request.id, {
				resolve,
				reject,
				language: options.spellingLanguage,
				dictionarySent: Boolean(dictionary),
			})
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
