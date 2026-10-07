import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { cn } from 'cn'
import { useMemo } from 'react'

import { focusBlockContentStart } from '#src/editor/extensions/focus-block-content-start'
import { isSelfContainedHtml } from '#src/editor/extensions/html-block/is-self-contained-html'
import { sanitizeHtml } from '#src/editor/extensions/html-block/sanitize-html'
import { useCaretInside } from '#src/hooks/use-caret-inside'

/**
 * An HTML block, drawn as the HTML it is while the caret is elsewhere and as
 * its source while the caret is in it - the source always mounted, since it is
 * the block's real, editable content.
 *
 * Source only, never drawn, when the block cannot stand on its own (half of
 * an element split around markdown) or draws nothing at all (a comment), so
 * there is always something on screen to click into.
 */
export function HtmlBlockView({ node, editor, getPos }: NodeViewProps) {
	const source = node.textContent
	const editing = useCaretInside({ editor, getPos })
	const html = useMemo(
		() => (isSelfContainedHtml(source) ? sanitizeHtml(source) : ''),
		[source]
	)
	const drawn = !editing && html.trim() !== ''

	return (
		<NodeViewWrapper data-type="html-block" className="not-typeset relative">
			{drawn && (
				<div
					contentEditable={false}
					data-testid="html-block-rendered"
					onClick={() => focusBlockContentStart(editor, getPos)}
					// Sanitized above (`sanitize-html.ts`), and drawn under the webview's
					// own content security policy besides.
					// oxlint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			)}
			<NodeViewContent<'pre'>
				as="pre"
				className={cn(
					'm-0 font-mono text-sm whitespace-pre-wrap text-muted-foreground outline-none',
					drawn && 'hidden'
				)}
			/>
		</NodeViewWrapper>
	)
}
