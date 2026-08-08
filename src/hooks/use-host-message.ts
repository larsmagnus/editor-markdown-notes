import { useEffect, useRef } from 'react'
import type { ZodType } from 'zod'

/**
 * Subscribes to one kind of message from the extension host.
 *
 * A webview's `message` channel carries traffic from anything sharing the page,
 * so every listener has to validate rather than trust `event.data`. Routing all
 * of them through one schema-checked hook is what keeps that guarantee in one
 * place.
 *
 * @param schema Rejects messages that are not this kind. Must not use `.catch()`
 * — a defaulted parse would turn foreign traffic into a bogus message.
 */
export function useHostMessage<T>(
	schema: ZodType<T>,
	onMessage: (message: T) => void,
	enabled: boolean
) {
	// Lets the caller pass an inline handler without re-subscribing every render.
	const handlerRef = useRef(onMessage)
	handlerRef.current = onMessage

	useEffect(() => {
		if (!enabled) return

		const handleMessage = (event: MessageEvent) => {
			const parsed = schema.safeParse(event.data)
			if (parsed.success) handlerRef.current(parsed.data)
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [schema, enabled])
}
