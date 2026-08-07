import { Textarea } from '@/components/ui/textarea'

interface FrontmatterPanelProps {
	value: string | null
	onChange: (value: string) => void
}

export function FrontmatterPanel({ value, onChange }: FrontmatterPanelProps) {
	if (value === null) return null

	// Grows with the content instead of scrolling internally, capped so a huge
	// block doesn't push the note's body off screen.
	const rows = Math.min(Math.max(value.split('\n').length, 2), 12)

	return (
		<div className="mb-3 rounded-md border bg-muted/50 focus-within:ring-2">
			<div className="border-b px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Frontmatter
			</div>
			<Textarea
				aria-label="Frontmatter"
				className="w-full resize-y border-none bg-transparent rounded-none rounded-b-md shadow-none font-mono text-sm text-muted-foreground focus-visible:ring-0 outline-none"
				rows={rows}
				spellCheck={false}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	)
}
