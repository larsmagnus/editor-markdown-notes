import type { MermaidWysiwygEditor } from '@visimer/core'
import type { MermaidCanvasView } from '@visimer/dom'

import { createDiagramEngine } from '#src/editor/extensions/mermaid/visual-editor/diagram-engine'

type DrawCanvasOptions = {
	core: typeof import('@visimer/core')
	dom: typeof import('@visimer/dom')
	mermaid: ConstructorParameters<typeof MermaidCanvasView>[0]['mermaid']
	code: string
	dark: boolean
	canvas: HTMLElement
}

export type DrawnCanvas = {
	view: MermaidCanvasView
	wysiwyg: MermaidWysiwygEditor
}

/** Starts the engine on `code` and draws its canvas into `canvas`. */
export function drawCanvas({
	core,
	dom,
	mermaid,
	code,
	dark,
	canvas,
}: DrawCanvasOptions): DrawnCanvas {
	const wysiwyg = createDiagramEngine(core.MermaidWysiwygEditor, code)
	const view = new dom.MermaidCanvasView({
		editor: wysiwyg,
		container: canvas,
		mermaid,
		mermaidConfig: {
			theme: dark ? 'dark' : 'default',
			securityLevel: 'strict',
		},
		panZoom: true,
	})

	return { wysiwyg, view }
}
