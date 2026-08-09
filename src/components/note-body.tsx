import { AppErrorBoundary } from '@/components/app-error-boundary'
import { RawMarkdownEditor } from '@/components/raw-markdown-editor'
import Editor from '@/editor/editor'

interface NoteBodyProps {
	content: string
	saveContent: (content: string) => void
	/** Show the markdown source rather than the rendered document. */
	raw: boolean
	className?: string
}

/** The note itself, as markdown source or as the rich document. */
export function NoteBody({
	content,
	saveContent,
	raw,
	className,
}: NoteBodyProps) {
	if (raw) {
		return (
			<RawMarkdownEditor
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
			<Editor
				content={content}
				includeProseBaseClassNames
				className={className}
			/>
		</AppErrorBoundary>
	)
}
