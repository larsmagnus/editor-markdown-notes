// oxlint-disable-next-line no-restricted-imports
import '../src/globals.css'

import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	decorators: [
		// The app itself toggles a `.dark` class on <html> (see theme-provider.tsx),
		// so this mirrors that exact mechanism instead of a separate wrapper div.
		withThemeByClassName({
			themes: {
				light: '',
				dark: 'dark',
			},
			defaultTheme: 'light',
			parentSelector: 'html',
		}),
	],
}

export default preview
