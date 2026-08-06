# [CLAUDE.md](http://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository

## Project Overview

This is a VSCode extension for editing markdown in an live preview powered by a React web application. Main project components include:

- **VSCode Extension**: Entry point at `src/extension.ts`, compiles to `out/extension.js`. The root package is `type: "module"` for Vite, but the extension host needs CommonJS, so `vscode:compile` writes an `out/package.json` containing `{"type":"commonjs"}` — everything under `out/` is CJS because of that sentinel.
- **React Web App**: Entry point at `src/main.tsx`, builds with Vite
- **Shared contract**: `src/shared/messages.ts` — host ↔ webview message types and defaults, included in both tsconfig projects. Value imports are safe from the extension host because the `out/package.json` sentinel makes `out/shared/messages.js` load as CommonJS.

## Development Commands

### Core Development

- `pnpm dev` - Start Vite development server for React app
- `pnpm build` - Build the React app and compile the extension (`tsc -b && vite build && pnpm vscode:compile`)
- `pnpm preview` - Preview built React app

### Quality & Testing

- `pnpm lint` - Run full linting pipeline: `pnpm typecheck && oxlint --fix && oxfmt`
- `pnpm typecheck` - TypeScript type checking without emitting files
- `pnpm test` - Run VSCode extension tests
- `pnpm pretest` - Prepare for testing (compile + lint)

### VSCode Extension

- `pnpm vscode:compile` - Compile TypeScript extension (`tsc -p ./tsconfig.extension.json`, then write the `out/package.json` CommonJS sentinel)
- `pnpm vscode:watch` - Watch mode compilation for extension
- `pnpm vscode:prepublish` - Prepare extension for publishing

#### Testing the Extension

1. Press F5 in VSCode to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select "Open with Editor Markdown Notes", or run "Editor Markdown Notes: Open file" from the command palette
4. The custom React-based markdown editor should now load without errors

## Architecture

### Key Components

#### Editor System (`src/editor/`)

- `editor.tsx` - Main TipTap-based markdown editor with auto-save functionality
- `menu-bar.tsx` & `menu-bubble.tsx` - Editor toolbars and formatting controls
- `button-*.tsx` - Specialized formatting buttons (color, heading, style)

#### Content Management

- `src/hooks/use-content.ts` - Manages markdown file loading from `src/content/` using Vite's `import.meta.glob`
- `src/hooks/use-settings.ts` & `src/hooks/use-theme.ts` - React contexts and their accessor hooks, kept out of the provider files so each `.tsx` exports exactly one component
- `src/lib/db.ts` - File system operations for markdown files with frontmatter support
- `src/lib/update-notes.ts` - Handles saving markdown content

#### UI Components (`src/components/`)

- Built with Radix UI primitives and shadcn/ui patterns
- `combobox.tsx` - File selector dropdown
- `content.tsx` - The editor surface: picks the content source (VSCode vs. local), renders the nav and either the raw `<pre>` or the TipTap editor
- `nav.tsx` - Top toolbar (file selector, raw/full-width toggles, theme toggle)
- `settings-provider.tsx` - Single source of truth for `viewOptions` (user toggles) and `settings` (VSCode configuration). In VSCode it seeds from `window.initialConfig`, posts `setViewOptions` to the host, and re-renders on `config` broadcasts; standalone it falls back to `localStorage`.
- `theme-provider.tsx` & `theme-toggle.tsx` - Dark/light theme system; the theme lives in `viewOptions`, so it persists alongside the other toggles
- `ui/` - Reusable UI components following shadcn/ui conventions

`App.tsx` is composition only: `SettingsProvider` → `ThemeProvider` → `Content`.

**One exported component per file.** `react/only-export-components` is enabled (off for `src/components/ui/**`), so contexts and hooks live in `src/hooks/` (`use-settings.ts`, `use-theme.ts`) and the matching `*-provider.tsx` files export only the provider component.

#### Extension Settings

Contributed under the `editorMarkdownNotes` section in `package.json` (`contributes.configuration`, which is also what surfaces the cog → Settings entry on the extension page). Persisted view options live in `context.globalState` under `editorMarkdownNotes.viewOptions` and are broadcast to every open webview panel, so tabs stay in sync. The `toggleRaw` / `toggleFullWidth` / `selectTheme` commands drive the same state from the command palette, gated on `activeCustomEditorId`.

#### Validation

`src/lib/schemas.ts` holds the zod schemas for everything the webview receives from outside itself (localStorage, host `config` messages). Every field uses `.catch()`, so parsing degrades to a default rather than throwing and blanking the editor.

**Keep zod out of the extension host.** The `.vsix` is packaged with `--no-dependencies`, so `node_modules` is not shipped and anything `src/extension.ts` requires at runtime must be dependency-free. The host merges over `DEFAULT_SETTINGS` / `DEFAULT_VIEW_OPTIONS` instead.

### Tech Stack

- **Editor**: TipTap (ProseMirror-based) with markdown serialization
- **UI**: React 19 + Radix UI + Tailwind CSS v4
- **Build**: Vite for web app, TypeScript compiler for extension
- **Styling**: Tailwind CSS with custom prose styling for markdown
- **File Management**: Gray-matter for frontmatter parsing

### Configuration Files

- `vite.config.ts` - Vite configuration with React and Tailwind plugins
- `tsconfig.json` - Project references to app and node configurations
- `tailwind.config.ts` - Tailwind v4 configuration
- `components.json` - shadcn/ui component configuration

### File Organization

- `src/content/` - Markdown files loaded dynamically by the editor
- `src/assets/` - Static assets
- `public/` - Public web assets including extension icon
- `out/` - Compiled VSCode extension output

## Important Notes

- The editor auto-saves with 1000ms debounce using `useDebounceValue`
- Markdown files are loaded at build time using Vite's `import.meta.glob`
- The app supports both raw text editing and rich WYSIWYG editing modes
- Theme switching is integrated into the editor toolbar
- All UI components follow the `@/` path alias pattern (`src/`)
