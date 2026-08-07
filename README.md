# Editor Markdown Notes

A VS Code custom editor that opens `.md` files in a WYSIWYG editor with live preview, built on [TipTap](https://tiptap.dev) and React.

![A VSCode window editing markdown with Editor Markdown Notes](https://raw.githubusercontent.com/larsmagnus/editor-markdown-notes/main/public/screenshot-editor-markdown-notes.png)

## Features

- WYSIWYG markdown editing as a VS Code custom editor for `*.md`
- Formatting toolbar plus a selection bubble menu (headings, text styles, colors, links)
- Follows the active VS Code color theme
- Toolbar toggles (raw markdown, full width, theme) persist across tabs and sessions

## Usage

Open the editor in any of these ways:

- Right-click a `.md` file in the Explorer → **Open with Editor Markdown Notes**
- Right-click inside an open markdown file → **Open with Editor Markdown Notes**
- Command Palette → **Editor Markdown Notes: Open file**
- Right-click a `.md` file → **Open With…** → **Editor Markdown Notes**

The default text editor is unchanged; this editor is registered with `priority: "option"`, so you opt in per file.

## Settings

Available under Settings → Extensions → Editor Markdown Notes (or the cog on the extension page):

| Setting                             | Default | Purpose                                                |
| ----------------------------------- | ------- | ------------------------------------------------------ |
| `editorMarkdownNotes.hideNav`       | `false` | Hide the editor's top navigation bar                   |
| `editorMarkdownNotes.centerContent` | `false` | Center the content horizontally when full width is off |

The toolbar toggles are also available from the command palette while the editor
is focused, so they stay reachable with `hideNav` turned on:

- **Editor Markdown Notes: Toggle raw markdown**
- **Editor Markdown Notes: Toggle full width**
- **Editor Markdown Notes: Select theme**

All three are shared across open tabs and persist between sessions.

## Troubleshooting

If the editor panel loads blank, run **Editor Markdown Notes: Show logs** from
the command palette and check the _Editor Markdown Notes_ output channel — the
webview forwards its errors there.

## Requirements

VS Code `^1.101.0`.

## Install locally

The extension is not published to the Marketplace. To build a `.vsix` and install it into your local VS Code:

```sh
pnpm vscode:install
```

Reload the window (Command Palette → **Developer: Reload Window**) after installing.

To uninstall: `code --uninstall-extension larsmagnus.editor-markdown-notes`.

## Development

| Command               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `pnpm dev`            | Vite dev server for the React app standalone  |
| `pnpm build`          | Build the web app and compile the extension   |
| `pnpm vscode:watch`   | Watch-mode compile of the extension host code |
| `pnpm typecheck`      | TypeScript check, no emit                     |
| `pnpm lint`           | Typecheck + `oxlint --fix` + `oxfmt`          |
| `pnpm test`           | Run both suites                               |
| `pnpm test:unit`      | Vitest webview tests                          |
| `pnpm test:extension` | Extension tests via `vscode-test`             |

### Running from source

1. Press <kbd>F5</kbd> in VS Code to launch the Extension Development Host
2. In the new window, open a `.md` file
3. Right-click the file and select **Open with Editor Markdown Notes**

## Disclaimer

Use or not at your own risk.
