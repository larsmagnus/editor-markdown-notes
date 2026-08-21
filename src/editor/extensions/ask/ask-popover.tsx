import { Sparkles } from 'lucide-react'
import { useState } from 'react'

import Header from '@/components/header'
import { PopoverArrow } from '@/components/popover-arrow'
import { PopoverIconTrigger } from '@/components/popover-icon-trigger'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useEditorAsk } from '@/hooks/use-editor-ask'

const ASK_PRESETS = [
	{ id: 'simplify', label: 'Simplify', prompt: 'Simplify this text.' },
	{
		id: 'shorten',
		label: 'Shorten',
		prompt: 'Shorten this text while keeping its meaning.',
	},
	{
		id: 'improve',
		label: 'Improve',
		prompt: 'Improve the clarity and flow of this text.',
	},
] as const

/**
 * Starts an AI rewrite of the current selection - three presets, or a
 * free-text ask. Submitting closes the popover and hands off to the ask
 * proposal extension (`ask-suggestion-extension.ts`), which is what actually
 * shows the reply, with accept/decline/redo - this component stays stateless
 * about the call itself, the same way `LinkPopover` stays stateless about
 * setting the link.
 */
export function AskPopover() {
	const { ask } = useEditorAsk()
	const [open, setOpen] = useState(false)
	const [prompt, setPrompt] = useState('')

	const submit = (value: string) => {
		if (!value.trim()) return
		ask(value.trim())
		setPrompt('')
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverIconTrigger icon={Sparkles} title="Ask Claude" />
			<PopoverContent side="top" sideOffset={12} className="w-80">
				<div className="grid gap-3">
					<Header level={4} className="leading-none">
						Ask Claude
					</Header>
					<div className="flex flex-wrap gap-1">
						{ASK_PRESETS.map((preset) => (
							<Button
								key={preset.id}
								type="button"
								variant="outline"
								size="sm"
								onClick={() => submit(preset.prompt)}
							>
								{preset.label}
							</Button>
						))}
					</div>
					<form
						className="grid gap-2"
						onSubmit={(event) => {
							event.preventDefault()
							event.stopPropagation()
							submit(prompt)
						}}
					>
						<Textarea
							value={prompt}
							onChange={(event) => setPrompt(event.target.value)}
							placeholder="Or ask something else…"
							rows={2}
						/>
						<Button type="submit" variant="default" size="sm">
							Ask
						</Button>
					</form>
				</div>
				<PopoverArrow />
			</PopoverContent>
		</Popover>
	)
}
