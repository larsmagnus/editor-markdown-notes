import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type ExternalChangeEpoch<Engine> = {
	/** Goes up each time the document's source stops matching the engine's. */
	epoch: number
	/** Where the caller keeps the engine it has mounted, for the comparison. */
	engine: RefObject<Engine | undefined>
}

/**
 * Counts the times the document's source stopped matching what the canvas holds
 * - undo, typing in the source - so a caller can remount on each.
 *
 * Remounting rather than telling the canvas the new source, because visimer
 * skips a render when the code equals what it last drew, which an in-place
 * label edit leaves untrue.
 */
export function useExternalChangeEpoch<Engine extends { code: string }>(
	code: string
): ExternalChangeEpoch<Engine> {
	const engine = useRef<Engine | undefined>(undefined)
	const [epoch, setEpoch] = useState(0)

	useEffect(() => {
		const current = engine.current
		if (current && current.code !== code) setEpoch((count) => count + 1)
	}, [code])

	return { epoch, engine }
}
