import { Copy } from 'lucide-react'

import { NodeActionButton } from '@/editor/node-action-button'
import { copyToClipboard } from '@/lib/clipboard'

type FrontmatterCopyButtonProps = { frontmatter: string }

/** Copies the frontmatter block's raw text to the clipboard when clicked. */
export function FrontmatterCopyButton({
	frontmatter,
}: FrontmatterCopyButtonProps) {
	function handleClick() {
		copyToClipboard(frontmatter)
	}

	return (
		<NodeActionButton
			icon={<Copy />}
			label="Copy frontmatter"
			tooltip="Copy"
			onClick={handleClick}
		/>
	)
}
