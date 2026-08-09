import type { PropsWithChildren } from 'react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import Content from '@/components/content'
import { SettingsProvider } from '@/components/settings-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

function App({
	defaultFileName = 'notes.md',
}: PropsWithChildren<{ defaultFileName?: string }>) {
	return (
		// Outermost, so a throw from the providers themselves still reports rather
		// than leaving the panel blank with nothing in the log channel.
		<AppErrorBoundary title="The editor">
			<SettingsProvider>
				<ThemeProvider>
					<TooltipProvider delayDuration={300}>
						<Content defaultFileName={defaultFileName} />
					</TooltipProvider>
				</ThemeProvider>
			</SettingsProvider>
		</AppErrorBoundary>
	)
}

export default App
