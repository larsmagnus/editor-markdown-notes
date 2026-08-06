import { z } from 'zod'

import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

/**
 * Runtime validation for everything the webview receives from outside itself:
 * `localStorage` (hand-editable), and the config payloads posted by the
 * extension host (which may be an older version than this bundle).
 *
 * Webview-only on purpose. The extension is packaged with `--no-dependencies`,
 * so anything the host requires at runtime must be dependency-free — the host
 * merges over its own defaults instead.
 *
 * Two conventions here:
 * - Every field carries a `.catch()`, so parsing always yields a usable value
 *   rather than throwing and blanking the editor.
 * - `.meta()` comes *after* `.catch()`. `.catch()` returns a fresh schema that
 *   does not inherit the inner schema's registry entry, so metadata applied
 *   first is silently dropped.
 */

export const themeSchema = z
	.enum(['dark', 'light', 'system'])
	.catch(DEFAULT_VIEW_OPTIONS.theme)
	.meta({
		id: 'Theme',
		title: 'Theme',
		description:
			'Colour scheme for the editor surface. "system" follows the OS preference.',
		examples: ['dark', 'light', 'system'],
	})

export const viewOptionsSchema = z
	.object({
		raw: z.boolean().catch(DEFAULT_VIEW_OPTIONS.raw).meta({
			title: 'Raw markdown',
			description:
				'Show the unrendered markdown source instead of the WYSIWYG editor.',
		}),
		fullWidth: z.boolean().catch(DEFAULT_VIEW_OPTIONS.fullWidth).meta({
			title: 'Full width',
			description:
				"Let content fill the viewport, overriding the prose plugin's 65ch cap.",
		}),
		theme: themeSchema,
	})
	.catch(DEFAULT_VIEW_OPTIONS)
	.meta({
		id: 'ViewOptions',
		title: 'View options',
		description:
			'User-toggleable view state. Persisted in the host\'s globalState and broadcast to every open editor tab, so it survives reloads and stays in sync across tabs. Also settable from the "Toggle raw markdown", "Toggle full width" and "Select theme" commands.',
	})

export const extensionSettingsSchema = z
	.object({
		centerContent: z.boolean().catch(DEFAULT_SETTINGS.centerContent).meta({
			title: 'Center content',
			description:
				'Center the content horizontally when full width is off. Maps to `editorMarkdownNotes.centerContent`.',
		}),
		hideNav: z.boolean().catch(DEFAULT_SETTINGS.hideNav).meta({
			title: 'Hide nav',
			description:
				'Hide the top navigation bar. The toggles remain reachable from the command palette. Maps to `editorMarkdownNotes.hideNav`.',
		}),
	})
	.catch(DEFAULT_SETTINGS)
	.meta({
		id: 'ExtensionSettings',
		title: 'Extension settings',
		description:
			'Read-only in the webview — owned by VS Code Settings under the `editorMarkdownNotes` section and pushed down by the host.',
	})

export const configSchema = z
	.object({
		settings: extensionSettingsSchema,
		viewOptions: viewOptionsSchema,
	})
	.catch({ settings: DEFAULT_SETTINGS, viewOptions: DEFAULT_VIEW_OPTIONS })
	.meta({
		id: 'Config',
		title: 'Initial config',
		description:
			'Injected into the page as `window.initialConfig` before the bundle runs, so the first render already has the right theme and width.',
	})

export const configMessageSchema = z
	.object({
		type: z.literal('config'),
		settings: extensionSettingsSchema,
		viewOptions: viewOptionsSchema,
	})
	.meta({
		id: 'ConfigMessage',
		title: 'Config broadcast',
		description:
			"Posted by the host to every open panel whenever the settings or the stored view options change. Unlike the schemas above this one has no `.catch()` — a message that fails to parse is another extension's traffic and must be ignored, not defaulted.",
	})
