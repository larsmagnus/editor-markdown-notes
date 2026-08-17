import { AppErrorBoundary } from '@/components/app-error-boundary'
import { AskPromptInput } from '@/editor/slash-command/ask-prompt-input'

interface AskPromptInputWithBoundaryProps {
	onSubmit: (prompt: string) => void
	onCancel: () => void
}

/**
 * `AskPromptInput`, wrapped in its own `AppErrorBoundary` - `ask-prompt-render.ts`
 * mounts it via `ReactRenderer`, a React root outside the app's normal
 * component tree, so nothing else would catch a render failure here. "Remove"
 * closes the popup outright, the same as cancelling.
 */
export function AskPromptInputWithBoundary({
	onSubmit,
	onCancel,
}: AskPromptInputWithBoundaryProps) {
	return (
		<AppErrorBoundary title="Ask Claude" onRemove={onCancel}>
			<AskPromptInput onSubmit={onSubmit} onCancel={onCancel} />
		</AppErrorBoundary>
	)
}
