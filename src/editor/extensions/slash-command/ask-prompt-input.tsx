import { CornerDownLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from '@/components/ui/input-group'

interface AskPromptInputProps {
	onSubmit: (prompt: string) => void
	onCancel: () => void
	/** Seeds the box with text already typed - only used by Storybook, to show the Ask button enabled without a `play` function. */
	defaultValue?: string
}

/**
 * The free-text box `ask-prompt-render.ts` opens once "Ask Claude" is chosen
 * from the slash menu - a separate step rather than typing the prompt inline
 * after `/ask`, so the slash menu itself never has to stay pinned open.
 *
 * Enter submits (Shift+Enter for a newline), Escape or losing focus cancels -
 * cancelling leaves the already-deleted `/ask` text as is; nothing is
 * restored.
 */
export function AskPromptInput({
	onSubmit,
	onCancel,
	defaultValue = '',
}: AskPromptInputProps) {
	const [value, setValue] = useState(defaultValue)
	const ref = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		ref.current?.focus()
	}, [])

	const submit = () => {
		const trimmed = value.trim()
		if (trimmed) onSubmit(trimmed)
	}

	return (
		<InputGroup className="w-80 rounded-lg bg-popover shadow-md">
			<InputGroupTextarea
				ref={ref}
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder="Ask Claude…"
				rows={2}
				onBlur={onCancel}
				onKeyDown={(event) => {
					if (event.key === 'Enter' && !event.shiftKey) {
						event.preventDefault()
						submit()
						return
					}

					if (event.key === 'Escape') {
						event.preventDefault()
						onCancel()
					}
				}}
			/>
			<InputGroupAddon align="block-end">
				<InputGroupButton
					variant="ghost"
					size="sm"
					className="ml-auto"
					disabled={!value.trim()}
					// Prevents the textarea's `onBlur` (which cancels) from firing
					// before the click - without this, clicking the button cancels
					// the prompt instead of submitting it.
					onMouseDown={(event) => event.preventDefault()}
					onClick={submit}
				>
					Ask{' '}
					<Badge className="rounded-sm -mr-1">
						<CornerDownLeft />
					</Badge>
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	)
}
