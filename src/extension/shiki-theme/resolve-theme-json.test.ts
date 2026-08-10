import { describe, expect, it } from 'vitest'

import { resolveThemeJson } from './resolve-theme-json'

function readFrom(files: Record<string, string>) {
	return (filePath: string) => {
		const content = files[filePath]
		if (content === undefined) throw new Error(`no such file: ${filePath}`)
		return content
	}
}

describe('resolveThemeJson', () => {
	it('returns a theme with no include as-is', () => {
		const readFile = readFrom({
			'/themes/nord.json': JSON.stringify({
				name: 'Nord',
				colors: { 'editor.background': '#2e3440' },
				tokenColors: [
					{ scope: 'comment', settings: { foreground: '#616e88' } },
				],
			}),
		})

		expect(resolveThemeJson('/themes/nord.json', readFile)).toEqual({
			name: 'Nord',
			colors: { 'editor.background': '#2e3440' },
			tokenColors: [{ scope: 'comment', settings: { foreground: '#616e88' } }],
		})
	})

	it('merges colors from an included base theme, override winning per key', () => {
		const readFile = readFrom({
			'/themes/base.json': JSON.stringify({
				colors: {
					'editor.background': '#000000',
					'editor.foreground': '#ffffff',
				},
			}),
			'/themes/override.json': JSON.stringify({
				include: './base.json',
				colors: { 'editor.background': '#111111' },
			}),
		})

		expect(resolveThemeJson('/themes/override.json', readFile).colors).toEqual({
			'editor.background': '#111111',
			'editor.foreground': '#ffffff',
		})
	})

	it('concatenates tokenColors base-then-override, preserving cascade order', () => {
		const readFile = readFrom({
			'/themes/base.json': JSON.stringify({
				tokenColors: [{ scope: 'comment', settings: { foreground: '#888' } }],
			}),
			'/themes/override.json': JSON.stringify({
				include: './base.json',
				tokenColors: [{ scope: 'string', settings: { foreground: '#0f0' } }],
			}),
		})

		expect(
			resolveThemeJson('/themes/override.json', readFile).tokenColors
		).toEqual([
			{ scope: 'comment', settings: { foreground: '#888' } },
			{ scope: 'string', settings: { foreground: '#0f0' } },
		])
	})

	it('merges semanticTokenColors, override winning per key', () => {
		const readFile = readFrom({
			'/themes/base.json': JSON.stringify({
				semanticTokenColors: { variable: '#aaa', function: '#bbb' },
			}),
			'/themes/override.json': JSON.stringify({
				include: './base.json',
				semanticTokenColors: { variable: '#ccc' },
			}),
		})

		expect(
			resolveThemeJson('/themes/override.json', readFile).semanticTokenColors
		).toEqual({ variable: '#ccc', function: '#bbb' })
	})

	/**
	 * VS Code's own light themes declare `type` only in the innermost included
	 * file. Losing it makes Shiki treat the theme as dark, which picks dark
	 * fallback colors for a light theme.
	 */
	it('inherits fields the override does not restate, such as `type`', () => {
		const readFile = readFrom({
			'/themes/light_vs.json': JSON.stringify({
				type: 'light',
				colors: { 'editor.background': '#ffffff' },
			}),
			'/themes/light_modern.json': JSON.stringify({
				include: './light_vs.json',
				name: 'Default Light Modern',
			}),
		})

		expect(
			resolveThemeJson('/themes/light_modern.json', readFile)
		).toMatchObject({ type: 'light', name: 'Default Light Modern' })
	})

	it('does not loop forever on a self-referential include chain', () => {
		const readFile = readFrom({
			'/themes/loop.json': JSON.stringify({
				include: './loop.json',
				colors: { 'editor.background': '#000' },
			}),
		})

		expect(() => resolveThemeJson('/themes/loop.json', readFile)).not.toThrow()
	})

	it('resolves the include path relative to the file that declares it', () => {
		const readFile = readFrom({
			'/themes/base/dark.json': JSON.stringify({
				colors: { 'editor.background': '#000' },
			}),
			'/themes/variants/override.json': JSON.stringify({
				include: '../base/dark.json',
			}),
		})

		expect(
			resolveThemeJson('/themes/variants/override.json', readFile).colors
		).toEqual({ 'editor.background': '#000' })
	})
})
