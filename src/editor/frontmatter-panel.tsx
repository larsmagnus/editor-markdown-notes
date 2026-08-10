import { Textarea } from '@/components/ui/textarea'

interface FrontmatterPanelProps {
	value: string | null
	onChange: (value: string) => void
}

export function FrontmatterPanel({ value, onChange }: FrontmatterPanelProps) {
	if (value === null) return null

	return (
		<div className="mb-3 rounded-md border bg-muted/50 focus-within:ring-2">
			<div className="border-b px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Frontmatter
			</div>
			<Textarea
				aria-label="Frontmatter"
				// `field-sizing-content` (from the shared Textarea) grows this with its
				// content and has no cap - deliberately, so a large frontmatter block
				// never scrolls within its own box. Scrolling stays with the page.
				className="w-full min-h-9 resize-none border-none bg-transparent rounded-none rounded-b-md shadow-none font-mono text-sm text-muted-foreground focus-visible:ring-0 outline-none"
				spellCheck={false}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	)
}
