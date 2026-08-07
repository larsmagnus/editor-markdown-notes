'use client'

import { BubbleMenu } from '@tiptap/react'
import {
	CircleOff,
	Heading,
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6,
	Link,
	Unlink,
} from 'lucide-react'
import { useState } from 'react'
import defaultColors from 'tailwindcss/colors'

import Header from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Popover,
	PopoverArrow,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { ButtonColor } from '@/editor/button-color'
import { ButtonHeading } from '@/editor/button-heading'
import { ButtonStyle } from '@/editor/button-style'
import { useEditorTools } from '@/hooks/use-editor-tools'
import { cn } from '@/lib/utils'

/**
 * A contextual menu that is only visible
 * when selecting text
 */
export function MenuBubble() {
	const { editor, url, setUrl, reset, setLink, unsetLink, getSelectedLink } =
		useEditorTools()

	const [open, setOpen] = useState(false)

	if (!editor) {
		return null
	}

	return (
		<BubbleMenu
			editor={editor}
			tippyOptions={{
				duration: 50,
			}}
		>
			<div className="flex items-center gap-1 p-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xs drop-shadow-lg w-[400px]">
				<Popover>
					<PopoverTrigger asChild>
						<Button type="button" variant="ghost" size="sm" title="Heading">
							<Heading className="size-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						side="top"
						sideOffset={12}
						className="w-auto p-2 flex gap-1"
					>
						<ButtonHeading level={1}>
							<Heading1 />
						</ButtonHeading>

						<ButtonHeading level={2}>
							<Heading2 />
						</ButtonHeading>

						<ButtonHeading level={3}>
							<Heading3 />
						</ButtonHeading>

						<ButtonHeading level={4}>
							<Heading4 />
						</ButtonHeading>

						<ButtonHeading level={5}>
							<Heading5 />
						</ButtonHeading>

						<ButtonHeading level={6}>
							<Heading6 />
						</ButtonHeading>

						<PopoverArrow className="fill-popover" />
					</PopoverContent>
				</Popover>

				<ButtonStyle style="bold" className="font-bold" />
				<ButtonStyle style="italic" className="italic" />
				<ButtonStyle style="strike" className="line-through" />

				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							title="Link"
							onClick={() => {
								setUrl(getSelectedLink())
								setOpen(true)
							}}
							className={cn(
								'font-bold',
								editor.isActive('link') ? 'is-active' : ''
							)}
						>
							<Link className="size-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent side="top" sideOffset={12} className="w-80">
						<form
							className="grid gap-4"
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								setLink()
							}}
						>
							<div className="space-y-2">
								<Header level={4} className="leading-none">
									Link
								</Header>
							</div>
							<div className="grid gap-2">
								<div className="flex items-center gap-4">
									<Label htmlFor="url">URL</Label>
									<Input
										id="url"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										placeholder="Enter URL"
										type="text"
									/>
								</div>
								<Button
									type="submit"
									variant="default"
									size="sm"
									onClick={() => setLink(() => setOpen(false))}
								>
									Apply
								</Button>
							</div>
						</form>
						<PopoverArrow className="fill-popover" />
					</PopoverContent>
				</Popover>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					title="Unlink"
					onClick={() => unsetLink(() => setOpen(false))}
					className={cn(
						'font-bold',
						editor.isActive('link') ? 'is-active' : ''
					)}
				>
					<Unlink className="size-4" />
				</Button>

				<ButtonColor
					className="bg-red-500 hover:bg-red-300"
					color={defaultColors.red[500]}
				/>

				<ButtonColor
					className="bg-yellow-400 hover:bg-yellow-200"
					color={defaultColors.yellow[400]}
				/>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					title="Reset all styles and formatting"
					onClick={reset}
				>
					<CircleOff className="size-4" />
				</Button>
			</div>
		</BubbleMenu>
	)
}
