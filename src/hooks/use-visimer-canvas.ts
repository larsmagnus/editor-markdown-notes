import type { NodeViewProps } from '@tiptap/react'
import type { MermaidWysiwygEditor } from '@visimer/core'
import type { MermaidCanvasView } from '@visimer/dom'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

import { startVisimer } from '#src/editor/extensions/mermaid/visual-editor/start-visimer'
import { useExternalChangeEpoch } from '#src/hooks/use-external-change-epoch'
import { useIsDark } from '#src/hooks/use-is-dark'

type VisimerCanvasOptions = Pick<NodeViewProps, 'editor' | 'getPos'> & {
	/** The block's mermaid source, as the document currently holds it. */
	code: string
	/** The frame holding the canvas and the chrome drawn over it. */
	frameRef: RefObject<HTMLElement | null>
}

type VisimerCanvas = {
	/** Where visimer draws; attach to the element that is to hold the diagram. */
	canvasRef: RefObject<HTMLDivElement | null>
	view: RefObject<MermaidCanvasView | undefined>
	wysiwyg: RefObject<MermaidWysiwygEditor | undefined>
	/** Entity ids currently selected on the canvas. */
	selection: string[]
	connecting: boolean
}

/**
 * Keeps visimer mounted over a mermaid block and the two agreeing on the
 * source.
 *
 * A change the canvas did not make (undo, typing in the source) remounts it,
 * because visimer skips a render when the code equals what it last drew -
 * which an in-place label edit leaves untrue.
 */
export function useVisimerCanvas({
	editor,
	getPos,
	code,
	frameRef,
}: VisimerCanvasOptions): VisimerCanvas {
	const canvasRef = useRef<HTMLDivElement>(null)
	const view = useRef<MermaidCanvasView | undefined>(undefined)
	const latestCode = useRef(code)
	const dark = useIsDark()
	const { epoch, engine: wysiwyg } =
		useExternalChangeEpoch<MermaidWysiwygEditor>(code)
	const [selection, setSelection] = useState<string[]>([])
	const [connecting, setConnecting] = useState(false)
	const [failure, setFailure] = useState<unknown>()

	useEffect(() => {
		latestCode.current = code
	}, [code])

	useEffect(() => {
		const canvas = canvasRef.current
		const frame = frameRef.current
		if (!canvas || !frame) return

		const stop = startVisimer(
			{
				editor,
				getPos,
				code: latestCode.current,
				dark,
				frame,
				canvas,
				onSelectionChange: setSelection,
				onConnectingChange: setConnecting,
			},
			(mounted) => {
				view.current = mounted.view
				wysiwyg.current = mounted.wysiwyg
			},
			setFailure
		)

		return () => {
			stop()
			view.current = undefined
			wysiwyg.current = undefined
			setSelection([])
			setConnecting(false)
		}
	}, [editor, getPos, dark, epoch, frameRef, wysiwyg])

	// A render error is what the surrounding boundary catches; a rejected promise
	// is not, and would leave a blank canvas that nothing reports.
	if (failure) throw failure

	return { canvasRef, view, wysiwyg, selection, connecting }
}
