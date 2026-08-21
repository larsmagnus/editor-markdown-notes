import type { PropsWithChildren } from 'react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import { SettingsProvider } from '@/components/settings-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from '@/layout'
import type { ExtensionSettings, ViewOptions } from '@/shared/messages'

function App({
	defaultFileName = 'notes.md',
	initialViewOptions,
	initialSettings,
}: PropsWithChildren<{
	defaultFileName?: string
	initialViewOptions?: Partial<ViewOptions>
	initialSettings?: Partial<ExtensionSettings>
}>) {
	return (
		// Outermost, so a throw from the providers themselves still reports rather
		// than leaving the panel blank with nothing in the log channel.
		<AppErrorBoundary title="The editor">
			<SettingsProvider
				initialViewOptions={initialViewOptions}
				initialSettings={initialSettings}
			>
				<ThemeProvider>
					<TooltipProvider delay={300}>
						<Layout defaultFileName={defaultFileName} />
					</TooltipProvider>
				</ThemeProvider>
			</SettingsProvider>
		</AppErrorBoundary>
	)
}

export default App
