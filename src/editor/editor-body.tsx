import { AppErrorBoundary } from '@/components/app-error-boundary'
import EditorModeLive from '@/editor/editor-mode-live'
import { EditorModeRaw } from '@/editor/editor-mode-raw'

interface EditorBodyProps {
	content: string
	saveContent: (content: string) => void
	/** Show the markdown source rather than the rendered document. */
	raw: boolean
	className?: string
}

/** The editor body itself, as markdown source or as the rich document. */
export function EditorBody({
	content,
	saveContent,
	raw,
	className,
}: EditorBodyProps) {
	if (raw) {
		return (
			<EditorModeRaw
				content={content}
				saveContent={saveContent}
				className={className}
			/>
		)
	}

	// Contained rather than fatal, so the toolbar survives and raw mode stays
	// reachable as the escape hatch for a note that will not parse.
	return (
		<AppErrorBoundary title="The editor" resetKeys={[content]}>
			<EditorModeLive
				content={content}
				saveContent={saveContent}
				includeProseBaseClassNames
				className={className}
			/>
		</AppErrorBoundary>
	)
}
