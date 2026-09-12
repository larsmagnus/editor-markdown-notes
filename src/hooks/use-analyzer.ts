import { useCallback, useEffect, useRef } from 'react'

import type { Analyzer } from '#src/lib/text-tools/analyze-client'

/** What `useAnalysis` needs to run a worker it does not own the lifetime of -
 *  shared by every caller so the live and raw editors can be handed the same
 *  analyzer instance rather than each spinning up their own. */
export type AnalyzerHandle = {
	getAnalyzer: () => Promise<Analyzer | null>
	disposeAnalyzer: () => void
}

/**
 * Owns the analysis worker's lifetime, so the hook that runs the checks does
 * not also have to.
 *
 * The client - and the whole retext stack inlined into it - is reached through
 * `await import()`, which is what keeps it out of the entry chunk. That import
 * can resolve after the caller has gone, so a worker is never created once the
 * hook has torn down: doing so would leak one per unmount, with nothing left
 * holding a handle to terminate it.
 */
export function useAnalyzer() {
	const analyzerRef = useRef<Analyzer | null>(null)
	const isTornDownRef = useRef(false)
	// Bumped by every disposeAnalyzer() call, so an import in flight when text
	// tools are switched off mid-load can tell it was disposed - unmount alone
	// wouldn't catch that, since disposeAnalyzer() also runs on the disable path.
	const generationRef = useRef(0)

	const disposeAnalyzer = useCallback(() => {
		generationRef.current += 1
		analyzerRef.current?.dispose()
		analyzerRef.current = null
	}, [])

	const getAnalyzer = useCallback(async () => {
		if (analyzerRef.current) return analyzerRef.current

		const generation = generationRef.current
		const { createAnalyzer } =
			await import('#src/lib/text-tools/analyze-client')
		if (isTornDownRef.current || generation !== generationRef.current)
			return null

		analyzerRef.current = createAnalyzer()

		return analyzerRef.current
	}, [])

	useEffect(() => {
		isTornDownRef.current = false

		return () => {
			isTornDownRef.current = true
			disposeAnalyzer()
		}
	}, [disposeAnalyzer])

	return { getAnalyzer, disposeAnalyzer }
}

/**
 * `analyzer` when the caller was handed one to share (`EditorBody`, splitting
 * it between the live and raw editors), otherwise one owned right here - for
 * every standalone mount (stories, component tests) with no `EditorBody`
 * around it to share one with.
 */
export function useSharedAnalyzer(analyzer?: AnalyzerHandle): AnalyzerHandle {
	const ownAnalyzer = useAnalyzer()
	return analyzer ?? ownAnalyzer
}
