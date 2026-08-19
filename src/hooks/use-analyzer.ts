import { useCallback, useEffect, useRef } from 'react'

import type { Analyzer } from '@/lib/text-tools/analyze-client'

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

	const disposeAnalyzer = useCallback(() => {
		analyzerRef.current?.dispose()
		analyzerRef.current = null
	}, [])

	const getAnalyzer = useCallback(async () => {
		if (analyzerRef.current) return analyzerRef.current

		const { createAnalyzer } = await import('@/lib/text-tools/analyze-client')
		if (isTornDownRef.current) return null

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
