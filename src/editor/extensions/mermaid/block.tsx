import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import { PanZoom } from '@/components/pan-zoom'
import { MERMAID_LANGUAGE } from '@/editor/extensions/mermaid/language'
import { MermaidToolbar } from '@/editor/extensions/mermaid/toolbar'
import { useCaretInside } from '@/hooks/use-caret-inside'
import { useIsDark } from '@/hooks/use-is-dark'
import { useMermaidRender } from '@/hooks/use-mermaid-render'
import { cn } from '@/lib/utils'

type MermaidBlockProps = Pick<NodeViewProps, 'node' | 'editor' | 'getPos'>

/** A fenced `mermaid` block: its diagram, or its source while it is edited. */
export function MermaidBlock({ node, editor, getPos }: MermaidBlockProps) {
	const isEditing = useCaretInside({ editor, getPos })
	const result = useMermaidRender(node.textContent, useIsDark(), isEditing)

	const failed = result && 'error' in result
	// The source is the only way to fix a diagram that will not parse, so an
	// error shows it whether or not the block is being edited. It also stands in
	// until the first render lands - mermaid arrives over a dynamic import, and
	// showing the fence beats an empty gap where the diagram will go (or forever,
	// if that import never resolves).
	const showSource = isEditing || failed || !result

	// Moving the caret into the block is what reveals the source - there is no
	// separate editing flag to set.
	const startEditing = () => {
		// `getPos` survives the node view being detached and returns `undefined`
		// from then on, which would make this `NaN`. See `useCaretInside`.
		const pos = typeof getPos === 'function' ? getPos() : undefined
		if (pos === undefined) return

		editor
			.chain()
			.focus()
			.setTextSelection(pos + 1)
			.run()
	}

	return (
		<NodeViewWrapper className="group relative not-prose my-4">
			{!showSource && result && 'svg' in result ? (
				// Everything the viewport draws is generated, not authored, so it
				// stays outside what ProseMirror treats as editable content.
				<div contentEditable={false}>
					<PanZoom
						// The border is always drawn, unlike the rest of the editor's
						// hover affordances: a diagram taller than the cap is clipped,
						// and an edge is what says so rather than leaving it looking
						// like the diagram simply ends there.
						className="max-h-[32rem] rounded-md border border-border/50 p-2 hover:border-border"
						controls={
							<MermaidToolbar
								code={node.textContent}
								svg={result.svg}
								onEdit={startEditing}
							/>
						}
					>
						<div
							role="img"
							aria-label="Mermaid diagram"
							dangerouslySetInnerHTML={{ __html: result.svg }}
						/>
					</PanZoom>
				</div>
			) : null}

			{failed ? (
				<p role="alert" className="m-0 text-sm text-red-600 dark:text-red-400">
					{result.error}
				</p>
			) : null}

			{/* The content DOM has to stay mounted for ProseMirror to map positions
			    into it. `display: none` would leave it unmeasurable, so it is
			    collapsed out of the layout instead. */}
			<pre
				className={cn('m-0', !showSource && 'absolute h-0 w-0 overflow-hidden')}
			>
				<NodeViewContent<'code'>
					as="code"
					className={`language-${MERMAID_LANGUAGE}`}
				/>
			</pre>
		</NodeViewWrapper>
	)
}
