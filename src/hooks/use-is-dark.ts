import { useTheme } from '@/hooks/use-theme'

/** Whether the editor is currently dark, resolving the "system" preference. */
export function useIsDark(): boolean {
	const { theme } = useTheme()

	if (theme === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
	}

	return theme === 'dark'
}
