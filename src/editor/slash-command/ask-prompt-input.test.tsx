import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AskPromptInput } from './ask-prompt-input'

describe('AskPromptInput', () => {
	it('submits the trimmed prompt on Enter', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn()
		render(<AskPromptInput onSubmit={onSubmit} onCancel={vi.fn()} />)

		await user.type(
			screen.getByRole('textbox'),
			'  Summarise this note  {Enter}'
		)

		expect(onSubmit).toHaveBeenCalledWith('Summarise this note')
	})

	it('inserts a newline instead of submitting on Shift+Enter', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn()
		render(<AskPromptInput onSubmit={onSubmit} onCancel={vi.fn()} />)

		await user.type(
			screen.getByRole('textbox'),
			'Line one{Shift>}{Enter}{/Shift}Line two'
		)

		expect(onSubmit).not.toHaveBeenCalled()
		expect(screen.getByRole('textbox')).toHaveValue('Line one\nLine two')
	})

	it('cancels on Escape', async () => {
		const user = userEvent.setup()
		const onCancel = vi.fn()
		render(<AskPromptInput onSubmit={vi.fn()} onCancel={onCancel} />)

		await user.type(screen.getByRole('textbox'), 'Summarise this note{Escape}')

		expect(onCancel).toHaveBeenCalled()
	})

	it('submits on clicking the Ask button, without cancelling from the blur it causes', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn()
		const onCancel = vi.fn()
		render(<AskPromptInput onSubmit={onSubmit} onCancel={onCancel} />)

		await user.type(screen.getByRole('textbox'), 'Summarise this note')
		await user.click(screen.getByRole('button', { name: /Ask/ }))

		expect(onSubmit).toHaveBeenCalledWith('Summarise this note')
		expect(onCancel).not.toHaveBeenCalled()
	})

	it('disables the Ask button while the prompt is empty', () => {
		render(<AskPromptInput onSubmit={vi.fn()} onCancel={vi.fn()} />)

		expect(screen.getByRole('button', { name: /Ask/ })).toBeDisabled()
	})
})
