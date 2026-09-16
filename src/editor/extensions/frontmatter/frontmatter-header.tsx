import type { Editor } from '@tiptap/react'
import { Code } from 'lucide-react'

import { ButtonAction } from '#src/components/button-action'
import { ButtonCopy } from '#src/components/button-copy'
import { ButtonDelete } from '#src/editor/extensions/frontmatter/button-delete'

type FrontmatterHeaderProps = {
	editor: Editor
	getPos: () => number | undefined
	copied: boolean
	onCopy: () => void
	onEditSource: () => void
}

/** The frontmatter box's label and action row - copy, edit source, delete. */
export function FrontmatterHeader({
	editor,
	getPos,
	copied,
	onCopy,
	onEditSource,
}: FrontmatterHeaderProps) {
	return (
		<div
			className="flex items-center justify-between border-b px-3 py-1.5"
			contentEditable={false}
		>
			<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Frontmatter
			</span>
			<div className="flex items-center gap-1">
				<ButtonAction
					icon={<Code />}
					label="Edit frontmatter source"
					tooltip="Edit source"
					onClick={onEditSource}
				/>
				<ButtonCopy copied={copied} label="Copy frontmatter" onClick={onCopy} />
				<ButtonDelete editor={editor} getPos={getPos} />
			</div>
		</div>
	)
}
