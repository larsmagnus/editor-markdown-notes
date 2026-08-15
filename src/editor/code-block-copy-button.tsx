import { Copy } from 'lucide-react'

import { NodeActionButton } from '@/editor/node-action-button'
import { copyToClipboard } from '@/lib/clipboard'

type CodeBlockCopyButtonProps = { code: string }

/** Copies a code block's text to the clipboard when clicked. */
export function CodeBlockCopyButton({ code }: CodeBlockCopyButtonProps) {
	function handleClick() {
		copyToClipboard(code)
	}

	return (
		<NodeActionButton
			icon={<Copy />}
			label="Copy code"
			tooltip="Copy"
			size="icon"
			className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
			onClick={handleClick}
		/>
	)
}
