import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

type CodeBlockCopyButtonProps = { code: string }

/** Copies a code block's text to the clipboard when clicked. */
export function CodeBlockCopyButton({ code }: CodeBlockCopyButtonProps) {
	function handleClick() {
		void navigator.clipboard?.writeText(code)
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="icon"
						contentEditable={false}
						aria-label="Copy code"
						className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
						onClick={handleClick}
					>
						<Copy />
					</Button>
				}
			/>
			<TooltipContent>Copy</TooltipContent>
		</Tooltip>
	)
}
