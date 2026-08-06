import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { SettingsContext } from '@/hooks/use-settings'
import {
	configMessageSchema,
	configSchema,
	viewOptionsSchema,
} from '@/lib/schemas'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'
import type { ViewOptions } from '@/shared/messages'

const STORAGE_KEY = 'editor-markdown-notes:view-options'

function readStoredViewOptions(): ViewOptions {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (!stored) return DEFAULT_VIEW_OPTIONS

		return viewOptionsSchema.parse(JSON.parse(stored))
	} catch {
		// Only reachable if JSON.parse throws; the schema itself always resolves.
		return DEFAULT_VIEW_OPTIONS
	}
}

function readInitialState() {
	if (!window.vscode) {
		return {
			viewOptions: readStoredViewOptions(),
			settings: DEFAULT_SETTINGS,
		}
	}

	return configSchema.parse(window.initialConfig)
}

export function SettingsProvider({ children }: PropsWithChildren) {
	// `window.vscode` is injected by the extension host before the bundle runs,
	// so unlike `useVSCode` this is known on the very first render.
	const isVSCodeContext = Boolean(window.vscode)
	const [state, setState] = useState(readInitialState)

	// Lets `setViewOptions` read the current options without depending on them,
	// so the callback stays stable and the writes stay outside the reducer.
	const viewOptionsRef = useRef(state.viewOptions)
	viewOptionsRef.current = state.viewOptions

	// The host broadcasts to every open panel, which is what keeps tabs in sync.
	useEffect(() => {
		if (!isVSCodeContext) return

		const handleMessage = (event: MessageEvent) => {
			const message = configMessageSchema.safeParse(event.data)
			if (!message.success) return

			setState({
				viewOptions: message.data.viewOptions,
				settings: message.data.settings,
			})
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [isVSCodeContext])

	const setViewOptions = useCallback((patch: Partial<ViewOptions>) => {
		const viewOptions = { ...viewOptionsRef.current, ...patch }

		// Persist outside the updater — StrictMode double-invokes updaters, and
		// React requires them to be pure.
		if (window.vscode) {
			window.vscode.postMessage({ type: 'setViewOptions', viewOptions })
		} else {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(viewOptions))
		}

		setState((current) => ({ ...current, viewOptions }))
	}, [])

	const value = useMemo(
		() => ({ ...state, setViewOptions, isVSCodeContext }),
		[state, setViewOptions, isVSCodeContext]
	)

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	)
}
