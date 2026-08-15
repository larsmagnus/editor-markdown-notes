import { ChevronDown, Code, FileCode } from 'lucide-react'

import { IconClaude } from '@/components/icons/icon-claude'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { openDiagramInClaude } from '@/editor/mermaid/actions'
import { NodeCopyButton } from '@/editor/node-copy-button'
import { useCopiedFeedback } from '@/hooks/use-copied-feedback'
import { useSettings } from '@/hooks/use-settings'
import { copyToClipboard } from '@/lib/clipboard'

type MermaidActionsButtonProps = {
	/** The block's mermaid source. */
	code: string
	/** The diagram mermaid rendered from `code`. */
	svg: string
}

/**
 * Gets one diagram out of the editor: its source, its rendered SVG, or a
 * Claude session pointed at it - the block-level counterpart to the toolbar's
 * `ButtonCopy`, which does the same for the whole note.
 */
export function MermaidActionsButton({ code, svg }: MermaidActionsButtonProps) {
	const { isVSCodeContext } = useSettings()
	const [copied, showCopiedFeedback] = useCopiedFeedback()

	function copyCode() {
		copyToClipboard(code)
		showCopiedFeedback()
	}

	function copySvg() {
		copyToClipboard(svg)
		showCopiedFeedback()
	}

	function openInClaude() {
		if (openDiagramInClaude(code, isVSCodeContext)) showCopiedFeedback()
	}

	return (
		<>
			{/* `CopiedBadge`, which `ButtonCopy` uses, floats to the left of its
			    anchor - it would land over the diagram here. The icon carries the
			    feedback instead. */}
			<NodeCopyButton
				copied={copied}
				label="Copy diagram code"
				onClick={copyCode}
			/>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							contentEditable={false}
							aria-label="Diagram actions"
						>
							<ChevronDown />
						</Button>
					}
				/>
				<DropdownMenuContent className="w-52">
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={copyCode}>
							<Code /> Copy diagram code
						</DropdownMenuItem>
						<DropdownMenuItem onClick={copySvg}>
							<FileCode /> Copy SVG
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={openInClaude}>
							<IconClaude /> Open in Claude
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	)
}
