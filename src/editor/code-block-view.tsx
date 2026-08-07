import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useState } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { renderMermaid } from '@/lib/render-mermaid'
import type { MermaidResult } from '@/lib/render-mermaid'
import { cn } from '@/lib/utils'

/** The language tag that turns a fenced block into a diagram. */
const MERMAID_LANGUAGE = 'mermaid'

/** The theme is stored as a preference, which may defer to the OS. */
function isDark(theme: string): boolean {
	if (theme === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
	}

	return theme === 'dark'
}

/**
 * The node view every code block renders through.
 *
 * A `mermaid` block shows its diagram and hides its source until it is clicked;
 * any other language keeps TipTap's `<pre><code>` output. The source itself is
 * untouched either way, so the markdown round trip is the same as it was before
 * this node view existed.
 */
export function CodeBlockView({ node, editor, getPos }: NodeViewProps) {
	const language = String(node.attrs.language ?? '')
	const isMermaid = language === MERMAID_LANGUAGE

	if (!isMermaid) {
		return (
			<NodeViewWrapper as="pre">
				<NodeViewContent
					as="code"
					className={language ? `language-${language}` : undefined}
				/>
			</NodeViewWrapper>
		)
	}

	return <MermaidBlock node={node} editor={editor} getPos={getPos} />
}

type MermaidBlockProps = Pick<NodeViewProps, 'node' | 'editor' | 'getPos'>

/**
 * Is the caret inside this block right now?
 *
 * This cannot be answered with a DOM blur: the source sits in the editor's one
 * contenteditable element, so clicking another paragraph moves the caret
 * without anything losing focus. The editor's own selection is the only thing
 * that tracks it - which also means arrowing into a collapsed block reveals its
 * source rather than losing the caret in it.
 */
function useCaretInside({
	editor,
	getPos,
}: Pick<MermaidBlockProps, 'editor' | 'getPos'>): boolean {
	const [inside, setInside] = useState(false)

	useEffect(() => {
		const update = () => {
			if (typeof getPos !== 'function') return setInside(false)

			const start = getPos()
			const node = editor.state.doc.nodeAt(start)
			const { from, to } = editor.state.selection

			setInside(
				Boolean(node) &&
					editor.isFocused &&
					from >= start &&
					to <= start + (node?.nodeSize ?? 0)
			)
		}

		// Deliberately not called for the selection the block mounts with. The
		// editor autofocuses its end, so a note finishing with a diagram would
		// otherwise open showing source nobody asked to edit.
		editor.on('selectionUpdate', update)
		editor.on('focus', update)
		editor.on('blur', update)

		return () => {
			editor.off('selectionUpdate', update)
			editor.off('focus', update)
			editor.off('blur', update)
		}
	}, [editor, getPos])

	return inside
}

function MermaidBlock({ node, editor, getPos }: MermaidBlockProps) {
	const { theme } = useTheme()
	const isEditing = useCaretInside({ editor, getPos })
	const [result, setResult] = useState<MermaidResult>()

	const source = node.textContent
	const dark = isDark(theme)

	// Only rendered while previewing: mermaid does not need to keep up with every
	// keystroke, and the diagram is not on screen to see it anyway.
	useEffect(() => {
		if (isEditing) return

		let current = true
		renderMermaid(source, dark).then((next) => {
			if (current) setResult(next)
		})

		return () => {
			current = false
		}
	}, [source, dark, isEditing])

	// Moving the caret into the block is what reveals the source - there is no
	// separate editing flag to set.
	const startEditing = () => {
		if (typeof getPos !== 'function') return

		editor
			.chain()
			.focus()
			.setTextSelection(getPos() + 1)
			.run()
	}

	const failed = result && 'error' in result
	// The source is the only way to fix a diagram that will not parse, so an
	// error shows it whether or not the block is being edited. It also stands in
	// until the first render lands - mermaid arrives over a dynamic import, and
	// showing the fence beats an empty gap where the diagram will go (or forever,
	// if that import never resolves).
	const showSource = isEditing || failed || !result

	return (
		<NodeViewWrapper className="relative not-prose my-4">
			{!showSource && result && 'svg' in result ? (
				<button
					type="button"
					contentEditable={false}
					onClick={startEditing}
					aria-label="Mermaid diagram, click to edit the source"
					className="flex w-full cursor-pointer justify-center rounded border border-transparent p-2 hover:border-neutral-300 dark:hover:border-neutral-700"
					dangerouslySetInnerHTML={{ __html: result.svg }}
				/>
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
				<NodeViewContent as="code" className={`language-${MERMAID_LANGUAGE}`} />
			</pre>
		</NodeViewWrapper>
	)
}
