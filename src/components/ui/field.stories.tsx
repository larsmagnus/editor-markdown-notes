import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './checkbox'
import { Field, FieldLabel } from './field'

const meta = {
	component: Field,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		orientation: 'horizontal',
		children: (
			<>
				<Checkbox id="field-demo" />
				<FieldLabel htmlFor="field-demo">Label</FieldLabel>
			</>
		),
	},
}
