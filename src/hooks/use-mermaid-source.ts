import type { NodeViewProps } from '@tiptap/react'

import { useCaretInside } from '@/hooks/use-caret-inside'
import { useIsDark } from '@/hooks/use-is-dark'
import { useMermaidRender } from '@/hooks/use-mermaid-render'
import type { MermaidResult } from '@/lib/render-mermaid'

type MermaidSourceOptions = Pick<NodeViewProps, 'editor' | 'getPos'> & {
	code: string
	/** Whether this block's fence tag currently says `mermaid`. */
	isMermaid: boolean
}

type MermaidSource = {
	/** The diagram to draw in front of the source, once there is one. */
	result: MermaidResult | undefined
	/** Whether the block's own source is what should be on screen. */
	showSource: boolean
}

/**
 * Decides whether a code block shows its source or a diagram drawn from it.
 *
 * Every code block asks, mermaid or not, because the fence tag is editable text
 * and a block becomes one or stops being one as that tag is typed. Nothing is
 * rendered for the blocks that are not: mermaid arrives over a dynamic import
 * that a paused render never triggers.
 *
 * The source wins whenever there is no diagram to show in its place - while the
 * caret is in the block, when the source will not parse (the only way to fix it
 * is to see it), and until the first render lands, since an empty gap where a
 * diagram will go is worse than the fence, and permanent if that import never
 * resolves.
 */
export function useMermaidSource({
	editor,
	getPos,
	code,
	isMermaid,
}: MermaidSourceOptions): MermaidSource {
	const isEditing = useCaretInside({ editor, getPos })
	const result = useMermaidRender(code, useIsDark(), !isMermaid || isEditing)

	return {
		result,
		showSource: !isMermaid || isEditing || !result || 'error' in result,
	}
}
