import { lazy, Suspense } from 'react'

import Editor from '@/editor/editor'
import { useNoteSource } from '@/hooks/use-note-source'
import { useSettings } from '@/hooks/use-settings'
import { contentWidthClassName } from '@/lib/content-width-class'
import { cn } from '@/lib/utils'

const Toolbar = lazy(() => import('@/components/toolbar'))

type ContentProps = {
	defaultFileName: string
}

function Content({ defaultFileName }: ContentProps) {
	const { viewOptions, settings } = useSettings()
	const { content, fileName, setFileName, files } =
		useNoteSource(defaultFileName)

	const widthClassName = cn(
		'h-full',
		contentWidthClassName({
			fullWidth: viewOptions.fullWidth,
			centerContent: settings.centerContent,
		})
	)

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
					<pre className={widthClassName}>{content}</pre>
				) : (
					<Editor
						content={content}
						includeProseBaseClassNames
						className={widthClassName}
					/>
				)}
			</main>
		</div>
	)
}

export default Content
