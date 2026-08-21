import { lazy, Suspense } from 'react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import { EditorBody } from '@/editor/editor-body'
import { useNoteSource } from '@/hooks/use-note-source'
import { useScrollPosition } from '@/hooks/use-scroll-position'
import { useSettings } from '@/hooks/use-settings'
import { contentWidthClassName } from '@/lib/content-width-class'
import { cn } from '@/lib/utils'

const Toolbar = lazy(() => import('@/components/toolbar'))

type LayoutProps = {
	defaultFileName: string
}

function Layout({ defaultFileName }: LayoutProps) {
	const { viewOptions, settings } = useSettings()
	const { content, fileName, setFileName, files, saveContent } =
		useNoteSource(defaultFileName)

	// The one scrolling element on the page, so one offset covers the rich
	// editor and the raw markdown view alike.
	const scrollRef = useScrollPosition(fileName)

	const widthClassName = cn(
		'h-full',
		contentWidthClassName({
			fullWidth: viewOptions.fullWidth,
			centerContent: settings.centerContent,
		})
	)

	return (
		<div ref={scrollRef} className="h-screen overflow-auto">
			{!settings.hideToolbar && (
				<AppErrorBoundary title="The toolbar">
					<Suspense fallback={null}>
						<Toolbar
							files={files}
							fileName={fileName}
							setFileName={setFileName}
							content={content}
						/>
					</Suspense>
				</AppErrorBoundary>
			)}

			<main className="flex flex-col p-3 min-h-screen">
				<EditorBody
					content={content}
					saveContent={saveContent}
					raw={viewOptions.raw}
					className={widthClassName}
				/>
			</main>
		</div>
	)
}

export default Layout
