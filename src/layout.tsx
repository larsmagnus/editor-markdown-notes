import { cn } from 'cn'
import { lazy, Suspense } from 'react'

import { AppErrorBoundary } from '#src/components/app-error-boundary'
import { SkipLinks } from '#src/components/skip-links'
import { EditorBody } from '#src/editor/editor-body'
import { useNoteSource } from '#src/hooks/use-note-source'
import { useScrollPosition } from '#src/hooks/use-scroll-position'
import { useSettings } from '#src/hooks/use-settings'
import { contentWidthClassName } from '#src/lib/content-width-class'
import { getFileKind } from '#src/lib/file-kind'
import { toolbarHeightStyle } from '#src/lib/toolbar-height-style'

const Toolbar = lazy(() => import('#src/components/toolbar'))

type LayoutProps = {
	defaultFileName: string
}

function Layout({ defaultFileName }: LayoutProps) {
	const { viewOptions, settings } = useSettings()
	const { content, fileName, setFileName, files, syncContent } =
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
		<div
			ref={scrollRef}
			className="h-screen overflow-auto"
			style={toolbarHeightStyle(settings.hideToolbar)}
		>
			<SkipLinks raw={viewOptions.raw} textToolsOpen={viewOptions.textTools} />

			{!settings.hideToolbar && (
				<AppErrorBoundary title="The toolbar stopped working">
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
					syncContent={syncContent}
					raw={viewOptions.raw}
					className={widthClassName}
					fileKind={getFileKind(fileName)}
				/>
			</main>
		</div>
	)
}

export default Layout
