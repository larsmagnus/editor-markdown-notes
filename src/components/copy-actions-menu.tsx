import type { ReactNode } from 'react'

import { IconClaude } from '@/components/icons/icon-claude'
import {
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type CopyActionsMenuItem = {
	icon: ReactNode
	label: string
	onClick: () => void
}

type CopyActionsMenuProps = {
	/** The "copy as X" choices, e.g. markdown vs. plain text. */
	copyItems: CopyActionsMenuItem[]
	onOpenInClaude: () => void
}

/**
 * The dropdown content shared by every "copy this out of the editor" menu: a
 * group of copy variants, then a separated "Open in Claude" item. Renders
 * inside a caller-owned `DropdownMenu`/`DropdownMenuTrigger`, since those
 * differ with where the menu appears (the toolbar vs. a diagram overlay).
 */
export function CopyActionsMenu({
	copyItems,
	onOpenInClaude,
}: CopyActionsMenuProps) {
	return (
		<DropdownMenuContent className="w-52">
			<DropdownMenuGroup>
				{copyItems.map((item) => (
					<DropdownMenuItem key={item.label} onClick={item.onClick}>
						{item.icon} {item.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem onClick={onOpenInClaude}>
					<IconClaude /> Open in Claude
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	)
}
