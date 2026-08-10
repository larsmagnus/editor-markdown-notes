import { ChevronDown, Code, Copy, FileType, PencilSparkles } from 'lucide-react'

import { IconClaude } from '@/components/icons/icon-claude'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ButtonCopy() {
	return (
		<ButtonGroup>
			<Button variant="outline">
				<Copy /> Copy page
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="outline" aria-label="Open">
							<ChevronDown />
						</Button>
					}
				/>
				<DropdownMenuContent className="w-52">
					<DropdownMenuGroup>
						<DropdownMenuItem>Copy markdown</DropdownMenuItem>
						<DropdownMenuItem>Copy plain text</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<IconClaude /> Open in Claude
						</DropdownMenuItem>
						<DropdownMenuItem>
							<FileType /> Open in text editor
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Code /> Open in markdown editor
						</DropdownMenuItem>
						<DropdownMenuItem>
							<PencilSparkles /> Open in live editor
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	)
}
