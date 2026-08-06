import { createContext, useContext } from 'react'

import type { Theme } from '@/shared/messages'

export type ThemeState = {
	theme: Theme
	setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeState>({
	theme: 'system',
	setTheme: () => null,
})

export const useTheme = () => useContext(ThemeContext)
