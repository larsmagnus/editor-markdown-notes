import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field } from './field'

const meta = {
	component: Field,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {},
}
