import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { FrontmatterPanel } from './frontmatter-panel'

const meta = {
	component: FrontmatterPanel,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof FrontmatterPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		value: null,
		onChange: fn(),
	},
}
