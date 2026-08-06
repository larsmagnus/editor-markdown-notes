import type { PropsWithChildren } from 'react'

import Content from '@/components/content'
import { SettingsProvider } from '@/components/settings-provider'
import { ThemeProvider } from '@/components/theme-provider'

function App({
	defaultFileName = 'notes.md',
}: PropsWithChildren<{ defaultFileName?: string }>) {
	return (
		<SettingsProvider>
			<ThemeProvider>
				<Content defaultFileName={defaultFileName} />
			</ThemeProvider>
		</SettingsProvider>
	)
}

export default App
