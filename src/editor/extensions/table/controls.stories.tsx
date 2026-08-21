import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'

import { TableControls } from '@/editor/extensions/table/controls'
import { EditorContextDecorator } from '@/storybook/decorator-editor-context'

const TABLE = [
	'<table>',
	'<tr><th>Quarter</th><th>Revenue</th><th>Growth</th></tr>',
	'<tr><td>Q1 2025</td><td>1.2M</td><td>8%</td></tr>',
	'<tr><td>Q2 2025</td><td>1.4M</td><td>17%</td></tr>',
	'</table>',
].join('')

const meta = {
	component: TableControls,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			// The handles position themselves against their offset parent, which in
			// the app is the wrapper `EditorSurface` puts around the document.
			<div className="relative w-[40rem]">
				<EditorContextDecorator content={TABLE}>
					<Story />
				</EditorContextDecorator>
			</div>
		),
	],
} satisfies Meta<typeof TableControls>

export default meta
type Story = StoryObj<typeof meta>

/** The handles only appear once the caret is inside a cell. */
export const Primary: Story = {
	args: {},
	async play({ canvasElement }) {
		await userEvent.click(within(canvasElement).getByText('1.2M'))
	},
}

export const MenuOpen: Story = {
	args: {},
	async play({ canvasElement }) {
		const canvas = within(canvasElement)
		await userEvent.click(canvas.getByText('1.2M'))
		await userEvent.click(await canvas.findByLabelText('Column actions'))
	},
}
