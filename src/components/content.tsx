import { lazy, Suspense } from 'react'

import Editor from '@/editor/editor'
import useContent from '@/hooks/use-content'
import { useSettings } from '@/hooks/use-settings'
import { useVSCode } from '@/hooks/use-vscode'
import { cn } from '@/lib/utils'

const Toolbar = lazy(() => import('@/components/toolbar'))

type ContentProps = {
	defaultFileName: string
}

function Content({ defaultFileName }: ContentProps) {
	// Prefer the settings provider's flag over `useVSCode`'s: it is derived
	// synchronously from `window.vscode`, whereas `useVSCode` sets its copy in an
	// effect and so reports `false` on the first render.
	const { viewOptions, settings, isVSCodeContext } = useSettings()
	const vscodeContext = useVSCode()
	const fallbackContext = useContent({
		defaultFileName,
		// Skip the demo-content glob entirely inside VSCode.
		enabled: !isVSCodeContext,
	})

	// Use VSCode context if available, otherwise fall back to local content
	const { content, fileName, setFileName } = isVSCodeContext
		? {
				content: vscodeContext.content,
				fileName: vscodeContext.fileName,
				setFileName: () => {}, // VSCode handles file switching
			}
		: {
				content: fallbackContext.content,
				fileName: fallbackContext.fileName,
				setFileName: fallbackContext.setFileName,
			}

	const files = isVSCodeContext ? [] : fallbackContext.files

	// `max-w-full` overrides the prose plugin's built-in 65ch cap; `mx-auto`
	// centres the content against that cap instead.
	const widthClassName = viewOptions.fullWidth
		? 'max-w-full'
		: settings.centerContent && 'mx-auto'

	return (
		<div className="h-screen overflow-auto">
			{!settings.hideToolbar && (
				<Suspense fallback={null}>
					<Toolbar
						files={files}
						fileName={fileName}
						setFileName={setFileName}
					/>
				</Suspense>
			)}

			<main className="grid p-3 min-h-screen">
				{viewOptions.raw ? (
					<pre className={cn('h-full', widthClassName)} contentEditable>
						{content}
					</pre>
				) : (
					<Editor
						content={content}
						includeProseBaseClassNames
						className={cn('h-full', widthClassName)}
					/>
				)}
			</main>
		</div>
	)
}

export default Content
