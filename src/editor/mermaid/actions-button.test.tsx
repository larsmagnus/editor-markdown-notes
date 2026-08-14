import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider } from '@/components/settings-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MermaidActionsButton } from '@/editor/mermaid/actions-button'

const DIAGRAM_CODE = 'flowchart LR\n  A[Start] --> B[Ship it]'
const DIAGRAM_SVG = '<svg aria-roledescription="flowchart-v2"></svg>'

afterEach(() => {
	delete window.vscode
	localStorage.clear()
	vi.unstubAllGlobals()
	vi.clearAllMocks()
})

describe('MermaidActionsButton', () => {
	it('copies the diagram source when the copy button is clicked', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

		render(
			<SettingsProvider>
				<TooltipProvider>
					<MermaidActionsButton code={DIAGRAM_CODE} svg={DIAGRAM_SVG} />
				</TooltipProvider>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Copy diagram code'))

		expect(writeText).toHaveBeenCalledWith(DIAGRAM_CODE)
	})

	it('copies the rendered SVG from the menu', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

		render(
			<SettingsProvider>
				<TooltipProvider>
					<MermaidActionsButton code={DIAGRAM_CODE} svg={DIAGRAM_SVG} />
				</TooltipProvider>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Diagram actions'))
		await userEvent.click(await screen.findByText('Copy SVG'))

		expect(writeText).toHaveBeenCalledWith(DIAGRAM_SVG)
	})

	// The host knows which file this is but nothing about which of its diagrams
	// was asked about, so the source is what narrows the prompt.
	it('sends the diagram source to the host when opening Claude in VS Code', async () => {
		const postMessage = vi.fn()
		window.vscode = { postMessage, getState: () => {}, setState: () => {} }

		render(
			<SettingsProvider>
				<TooltipProvider>
					<MermaidActionsButton code={DIAGRAM_CODE} svg={DIAGRAM_SVG} />
				</TooltipProvider>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Diagram actions'))
		await userEvent.click(await screen.findByText('Open in Claude'))

		expect(postMessage).toHaveBeenCalledWith({
			type: 'openClaudeTerminal',
			content: DIAGRAM_CODE,
		})
	})

	// Standalone there is no host to ask, so the source travels by clipboard -
	// the same fallback the whole-note "Open in Claude" takes.
	it('copies the source and opens claude.ai outside VS Code', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
		const open = vi.fn()
		vi.stubGlobal('open', open)

		render(
			<SettingsProvider>
				<TooltipProvider>
					<MermaidActionsButton code={DIAGRAM_CODE} svg={DIAGRAM_SVG} />
				</TooltipProvider>
			</SettingsProvider>
		)

		await userEvent.click(screen.getByLabelText('Diagram actions'))
		await userEvent.click(await screen.findByText('Open in Claude'))

		expect(writeText).toHaveBeenCalledWith(DIAGRAM_CODE)
		expect(open).toHaveBeenCalledWith(
			'https://claude.ai',
			'_blank',
			'noopener,noreferrer'
		)
	})
})
