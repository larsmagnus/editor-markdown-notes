import { cn } from 'cn'

import { AppErrorBoundary } from '#src/components/app-error-boundary'
import { PAN_ZOOM_MIN_SCALE, PanZoom } from '#src/components/pan-zoom'
import { PAN_ZOOM_FRAME_CLASSNAME } from '#src/components/pan-zoom-frame'
import { MermaidToolbar } from '#src/editor/extensions/mermaid/toolbar'
import type { MermaidResult } from '#src/lib/render-mermaid'

type MermaidDiagramProps = {
	code: string
	result: MermaidResult | undefined
	/** Whether the block's own source is on screen; the diagram gives way to it. */
	showSource: boolean
	onEdit: () => void
}

/**
 * The diagram a fenced `mermaid` block draws in front of its source, and the
 * reason it could not be drawn when that is all there is. Renders nothing for
 * any other code block, which is what lets the block underneath it stay one
 * unchanging element as its fence tag is edited.
 *
 * Never the source itself: the code block underneath renders that, the same way
 * for every language, so that changing the fence tag changes what is drawn over
 * the source without disturbing the source itself.
 *
 * TipTap mounts each node view as its own React root, so the boundary here is
 * the only one that can contain a broken diagram without taking the document
 * with it - one around the editor would catch the throw far too late.
 */
export function MermaidDiagram({
	code,
	result,
	showSource,
	onEdit,
}: MermaidDiagramProps) {
	const failed = result && 'error' in result

	return (
		<AppErrorBoundary title="This diagram stopped working" resetKeys={[code]}>
			{!showSource && result && 'svg' in result ? (
				// Everything the viewport draws is generated, not authored, so it
				// stays outside what ProseMirror treats as editable content, and
				// outside the typography the authored source takes.
				<div contentEditable={false} className="not-typeset my-4 bg-pattern">
					<PanZoom
						minScale={PAN_ZOOM_MIN_SCALE}
						className={cn(PAN_ZOOM_FRAME_CLASSNAME, 'min-h-20')}
						controls={
							<MermaidToolbar code={code} svg={result.svg} onEdit={onEdit} />
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
		</AppErrorBoundary>
	)
}
