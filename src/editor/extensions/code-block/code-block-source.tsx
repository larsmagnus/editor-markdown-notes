import { NodeViewContent } from '@tiptap/react'

import { ButtonCopy } from '@/components/button-copy'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

type CodeBlockSourceProps = {
	code: string
	/** The fence tag, which becomes the `language-*` class Shiki reads. */
	language: string
	/** Whether the source is on screen, or collapsed behind a diagram. */
	visible: boolean
}

/**
 * The code a fenced block holds, and the button that copies it.
 *
 * Rendered for every code block whatever its fence tag says, so that a block
 * turning into a diagram - or stopping being one - never moves the text the
 * caret is in. Collapsed rather than unmounted for the same reason, and rather
 * than hidden with `display: none`, which would leave ProseMirror unable to
 * measure it. Padding goes with it: the block's own background would otherwise
 * paint a small empty box beside the diagram.
 */
export function CodeBlockSource({
	code,
	language,
	visible,
}: CodeBlockSourceProps) {
	const [copied, handleCopy] = useCopyToClipboard(code)

	return (
		// `relative` so the copy button anchors here rather than to the node view:
		// while collapsed it would otherwise float over the diagram, outside the
		// box that hides it.
		<pre
			className={cn(
				'relative',
				!visible && 'absolute m-0 h-0 w-0 overflow-hidden p-0'
			)}
		>
			{/* Only alongside the source it copies: a collapsed block still holds a
			    position for ProseMirror, so a button left in it stays reachable. */}
			{visible ? (
				<ButtonCopy
					copied={copied}
					label="Copy code"
					size="icon"
					className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
					onClick={handleCopy}
				/>
			) : null}
			<NodeViewContent<'code'>
				as="code"
				className={language ? `language-${language}` : undefined}
			/>
		</pre>
	)
}
