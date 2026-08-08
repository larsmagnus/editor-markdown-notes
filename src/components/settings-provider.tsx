import { useCallback, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { useHostMessage } from '@/hooks/use-host-message'
import { SettingsContext } from '@/hooks/use-settings'
import { readInitialSettings } from '@/lib/initial-settings'
import { configMessageSchema } from '@/lib/schemas'
import { writeStoredViewOptions } from '@/lib/view-options-storage'
import { getVSCodeApi, isVSCodeWebview } from '@/lib/vscode-api'
import type { ViewOptions } from '@/shared/messages'

export function SettingsProvider({ children }: PropsWithChildren) {
	// The host injects `window.vscode` before the bundle runs, so this is known
	// on the very first render - which is why it is the app's single source for
	// the answer.
	const isVSCodeContext = isVSCodeWebview()
	const [state, setState] = useState(readInitialSettings)

	// Lets `setViewOptions` read the current options without depending on them,
	// so the callback stays stable and the writes stay outside the reducer.
	const viewOptionsRef = useRef(state.viewOptions)
	viewOptionsRef.current = state.viewOptions

	// The host broadcasts to every open panel, which is what keeps tabs in sync.
	useHostMessage(
		configMessageSchema,
		(message) =>
			setState({
				viewOptions: message.viewOptions,
				settings: message.settings,
			}),
		isVSCodeContext
	)

	const setViewOptions = useCallback((patch: Partial<ViewOptions>) => {
		const viewOptions = { ...viewOptionsRef.current, ...patch }

		// Persist outside the updater — StrictMode double-invokes updaters, and
		// React requires them to be pure.
		const vscode = getVSCodeApi()
		if (vscode) {
			vscode.postMessage({ type: 'setViewOptions', viewOptions })
		} else {
			writeStoredViewOptions(viewOptions)
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
