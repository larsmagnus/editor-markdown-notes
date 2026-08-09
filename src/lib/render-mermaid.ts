import { errorMessage } from '@/lib/error-message'

/** An SVG to show, or the reason there isn't one. */
export type MermaidResult = { svg: string } | { error: string }

/** Mermaid derives DOM ids from this, so two diagrams must never share one. */
let diagramCount = 0

/**
 * Renders mermaid source to an SVG string.
 *
 * Mermaid is a few hundred kilobytes and pulls in a diagram bundle per syntax,
 * so it is imported dynamically - a note without diagrams never pays for it.
 */
export async function renderMermaid(
	code: string,
	dark: boolean
): Promise<MermaidResult> {
	try {
		const { default: mermaid } = await import('mermaid')

		mermaid.initialize({
			startOnLoad: false,
			securityLevel: 'strict',
			// Without this mermaid appends its own error graphic to document.body,
			// outside the editor and beyond React's reach. The thrown error is
			// reported in place instead.
			suppressErrorRendering: true,
			theme: dark ? 'dark' : 'default',
		})

		diagramCount += 1
		const { svg } = await mermaid.render(
			`mermaid-diagram-${diagramCount}`,
			code
		)

		return { svg }
	} catch (error) {
		return { error: errorMessage(error) }
	}
}
