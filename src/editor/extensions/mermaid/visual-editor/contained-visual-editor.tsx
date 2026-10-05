import type { ComponentProps } from 'react'

import { AppErrorBoundary } from '#src/components/app-error-boundary'
import { MermaidVisualEditor } from '#src/editor/extensions/mermaid/visual-editor/visual-editor'

/**
 * The visual editor, with a way out if it breaks: it is a dynamic import and a
 * third-party canvas, and TipTap mounts each node view as its own React root,
 * so no boundary further up can contain it.
 */
export function ContainedVisualEditor(
	props: ComponentProps<typeof MermaidVisualEditor>
) {
	return (
		<AppErrorBoundary
			title="The diagram editor stopped working"
			onRemove={props.onDone}
			removeLabel="Close editor"
		>
			<MermaidVisualEditor {...props} />
		</AppErrorBoundary>
	)
}
