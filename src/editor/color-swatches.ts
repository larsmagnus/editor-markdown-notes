import defaultColors from 'tailwindcss/colors'

/**
 * The colours the bubble menu offers. `className` paints the swatch and `color`
 * is what lands on the text, so the two have to name the same colour by hand -
 * Tailwind's class names are not readable at runtime.
 */
export const COLOR_SWATCHES = [
	{
		color: defaultColors.red[500],
		className: 'bg-red-500 hover:bg-red-300',
	},
	{
		color: defaultColors.yellow[400],
		className: 'bg-yellow-400 hover:bg-yellow-200',
	},
]
