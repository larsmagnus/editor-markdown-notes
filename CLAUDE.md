# [CLAUDE.md](http://CLAUDE.md)

# This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension for editing markdown in an live preview powered by a React web application. Main project components include:

- **VSCode Extension**: Entry point at `src/extension.ts`, compiles to `out/extension.js`
- **React Web App**: Entry point at `src/main.tsx`, builds with Vite

The current state of the project is a scaffold, and it must be modified to:

- Use VSCode's API to open files in the markdown editor in the current view
- Use VSCode's API to configure the extension settings

## Development Commands

### Core Development

- `pnpm dev` - Start Vite development server for React app
- `pnpm build` - Build both TypeScript extension and React app (`tsc -b && vite build`)
- `pnpm preview` - Preview built React app

### Quality & Testing

- `pnpm lint` - Run full linting pipeline: `pnpm typecheck && oxlint --fix && prettier . --write`
- `pnpm typecheck` - TypeScript type checking without emitting files
- `pnpm test` - Run VSCode extension tests
- `pnpm pretest` - Prepare for testing (compile + lint)

### VSCode Extension

- `pnpm vscode:compile` - Compile TypeScript extension (`tsc -p ./`)
- `pnpm vscode:watch` - Watch mode compilation for extension
- `pnpm vscode:prepublish` - Prepare extension for publishing

## Architecture

### Key Components

#### Editor System (`src/editor/`)

- `editor.tsx` - Main TipTap-based markdown editor with auto-save functionality
- `menu-bar.tsx` & `menu-bubble.tsx` - Editor toolbars and formatting controls
- `button-*.tsx` - Specialized formatting buttons (color, heading, style)

#### Content Management

- `src/hooks/use-content.ts` - Manages markdown file loading from `src/content/` using Vite's `import.meta.glob`
- `src/lib/db.ts` - File system operations for markdown files with frontmatter support
- `src/lib/update-notes.ts` - Handles saving markdown content

#### UI Components (`src/components/`)

- Built with Radix UI primitives and shadcn/ui patterns
- `combobox.tsx` - File selector dropdown
- `theme-provider.tsx` & `theme-toggle.tsx` - Dark/light theme system
- `ui/` - Reusable UI components following shadcn/ui conventions

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

- The editor auto-saves with 600ms debounce using `useDebounceValue`
- Markdown files are loaded at build time using Vite's `import.meta.glob`
- The app supports both raw text editing and rich WYSIWYG editing modes
- Theme switching is integrated into the editor toolbar
- All UI components follow the `@/` path alias pattern (`src/`)
