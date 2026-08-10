import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { ButtonGroup } from './button-group'

const meta = {
	component: ButtonGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: (
			<>
				<Button variant="outline">Copy</Button>
				<Button variant="outline">Paste</Button>
				<Button variant="outline">Cut</Button>
			</>
		),
	},
}
