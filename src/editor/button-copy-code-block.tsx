import { Copy } from 'lucide-react'

import { ButtonNodeAction } from '@/editor/button-node-action'
import { copyToClipboard } from '@/lib/clipboard'

type ButtonCopyCodeBlockProps = { code: string }

/** Copies a code block's text to the clipboard when clicked. */
export function ButtonCopyCodeBlock({ code }: ButtonCopyCodeBlockProps) {
	function handleClick() {
		copyToClipboard(code)
	}

	return (
		<ButtonNodeAction
			icon={<Copy />}
			label="Copy code"
			tooltip="Copy"
			size="icon"
			className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
			onClick={handleClick}
		/>
	)
}
