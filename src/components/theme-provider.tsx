import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useSettings } from '@/hooks/use-settings'
import { ThemeContext } from '@/hooks/use-theme'
import type { Theme } from '@/shared/messages'

/**
 * Applies the theme to the DOM. The theme itself is stored with the other view
 * options, so this must be rendered inside a `SettingsProvider`.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
	const { viewOptions, setViewOptions } = useSettings()
	const theme = viewOptions.theme

	useEffect(() => {
		const root = document.getElementById('root') || document.body

		root.classList.remove('light', 'dark')

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
				.matches
				? 'dark'
				: 'light'

			root.classList.add(systemTheme)
			return
		}

		root.classList.add(theme)
	}, [theme])

	const value = {
		theme,
		setTheme: (theme: Theme) => setViewOptions({ theme }),
	}

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
