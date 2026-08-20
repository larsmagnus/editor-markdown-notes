import { Copy } from 'lucide-react'

import { ButtonNodeAction } from '@/editor/button-node-action'
import { copyToClipboard } from '@/lib/clipboard'

type ButtonCopyProps = { frontmatter: string }

/** Copies the frontmatter block's raw text to the clipboard when clicked. */
export function ButtonCopy({ frontmatter }: ButtonCopyProps) {
	function handleClick() {
		copyToClipboard(frontmatter)
	}

	return (
		<ButtonNodeAction
			icon={<Copy />}
			label="Copy frontmatter"
			tooltip="Copy"
			onClick={handleClick}
		/>
	)
}
