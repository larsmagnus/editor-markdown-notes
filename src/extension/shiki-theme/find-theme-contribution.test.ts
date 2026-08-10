import { describe, expect, it } from 'vitest'

import type { ThemeExtensionLike } from './find-theme-contribution'
import { findThemeContribution } from './find-theme-contribution'

describe('findThemeContribution', () => {
	it('matches a theme by its declared id', () => {
		const extensions: ThemeExtensionLike[] = [
			{
				extensionPath: '/ext/dracula',
				packageJSON: {
					contributes: {
						themes: [
							{
								id: 'Dracula',
								label: 'Dracula Theme',
								path: './themes/dracula.json',
								uiTheme: 'vs-dark',
							},
						],
					},
				},
			},
		]

		expect(findThemeContribution(extensions, 'Dracula')).toEqual({
			extensionPath: '/ext/dracula',
			themePath: './themes/dracula.json',
			uiTheme: 'vs-dark',
		})
	})

	it('falls back to matching by label when a theme has no id', () => {
		const extensions: ThemeExtensionLike[] = [
			{
				extensionPath: '/ext/nord',
				packageJSON: {
					contributes: {
						themes: [
							{ label: 'Nord', path: './themes/nord.json', uiTheme: 'vs-dark' },
						],
					},
				},
			},
		]

		expect(findThemeContribution(extensions, 'Nord')).toEqual({
			extensionPath: '/ext/nord',
			themePath: './themes/nord.json',
			uiTheme: 'vs-dark',
		})
	})

	it('returns undefined when no extension contributes a matching theme', () => {
		const extensions: ThemeExtensionLike[] = [
			{
				extensionPath: '/ext/nord',
				packageJSON: {
					contributes: {
						themes: [
							{ label: 'Nord', path: './themes/nord.json', uiTheme: 'vs-dark' },
						],
					},
				},
			},
		]

		expect(findThemeContribution(extensions, 'One Dark Pro')).toBeUndefined()
	})

	it('prefers the first match when two installed extensions declare the same settingsId', () => {
		const extensions: ThemeExtensionLike[] = [
			{
				extensionPath: '/ext/first',
				packageJSON: {
					contributes: {
						themes: [
							{ label: 'Duplicate', path: './a.json', uiTheme: 'vs-dark' },
						],
					},
				},
			},
			{
				extensionPath: '/ext/second',
				packageJSON: {
					contributes: {
						themes: [
							{ label: 'Duplicate', path: './b.json', uiTheme: 'vs-dark' },
						],
					},
				},
			},
		]

		expect(findThemeContribution(extensions, 'Duplicate')).toEqual({
			extensionPath: '/ext/first',
			themePath: './a.json',
			uiTheme: 'vs-dark',
		})
	})

	it('returns undefined for an extension with no theme contributions at all', () => {
		const extensions: ThemeExtensionLike[] = [
			{ extensionPath: '/ext/none', packageJSON: {} },
		]

		expect(findThemeContribution(extensions, 'Nord')).toBeUndefined()
	})
})
