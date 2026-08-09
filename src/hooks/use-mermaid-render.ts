import { useEffect, useState } from 'react'

import { renderMermaid } from '@/lib/render-mermaid'
import type { MermaidResult } from '@/lib/render-mermaid'

/**
 * Renders mermaid source to an SVG, or to the reason it would not parse.
 *
 * Skipped while `paused`, which the caller sets when the source is being
 * edited: mermaid does not need to keep up with every keystroke, and the
 * diagram is not on screen to see it anyway.
 */
export function useMermaidRender(
	source: string,
	dark: boolean,
	paused: boolean
): MermaidResult | undefined {
	const [result, setResult] = useState<MermaidResult>()

	useEffect(() => {
		if (paused) return

		let current = true
		renderMermaid(source, dark).then((next) => {
			if (current) setResult(next)
		})

		return () => {
			current = false
		}
	}, [source, dark, paused])

	return result
}
