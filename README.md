# Markdown Editor Notes

A VS Code custom editor that opens `.md` files in a WYSIWYG editor with live preview, built on [TipTap](https://tiptap.dev) and React.

## Features

- WYSIWYG markdown editing as a VS Code custom editor for `*.md`
- Formatting toolbar plus a selection bubble menu (headings, text styles, colors, links)
- Follows the active VS Code color theme
- Auto-save with a 600ms debounce
- Frontmatter-aware via `gray-matter`

## Usage

Open the editor in any of these ways:

- Right-click a `.md` file in the Explorer → **Open with Editor Markdown Notes**
- Right-click inside an open markdown file → **Open with Editor Markdown Notes**
- Command Palette → **Markdown Editor: Open with Editor Markdown Notes**
- Right-click a `.md` file → **Open With…** → **Editor Markdown Notes**

The default text editor is unchanged; this editor is registered with `priority: "option"`, so you opt in per file.

## Requirements

VS Code `^1.101.0`.

## Install locally

The extension is not published to the Marketplace. To build a `.vsix` and install it into your local VS Code:

```sh
pnpm install
npx @vscode/vsce package --no-dependencies
code --install-extension editor-markdown-notes-0.1.0.vsix
```

Reload the window (Command Palette → **Developer: Reload Window**) after installing.

To uninstall: `code --uninstall-extension larsmagnus.editor-markdown-notes`.

## Development

| Command             | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Vite dev server for the React app standalone  |
| `pnpm build`        | Build the web app and compile the extension   |
| `pnpm vscode:watch` | Watch-mode compile of the extension host code |
| `pnpm typecheck`    | TypeScript check, no emit                     |
| `pnpm lint`         | Typecheck + `oxlint --fix` + `oxfmt`          |
| `pnpm test`         | Run extension tests via `vscode-test`         |

### Running from source

1. Press <kbd>F5</kbd> in VS Code to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select **Open with Editor Markdown Notes**

## Architecture

- `src/extension.ts` — extension host entry, registers the custom editor and command; compiled to `out/extension.cjs`
- `src/main.tsx` — React webview entry, bundled to `dist/` by Vite
- `src/editor/` — TipTap editor, toolbar, and bubble menu
- `src/components/` — Radix UI + shadcn/ui components

## License

MIT — see [LICENSE](LICENSE).
