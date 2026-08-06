# Change Log

All notable changes to the "editor-markdown-notes" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Persist the raw, full-width and theme toggles across editor tabs and sessions
- Add the `editorMarkdownNotes.centerContent` and `editorMarkdownNotes.hideNav` settings
- Add the **Editor Markdown Notes: Open file** command to the command palette
- Add **Toggle raw markdown**, **Toggle full width** and **Select theme** commands, so the toggles stay reachable when the nav is hidden
- Validate stored and received view options with zod
- Escape `<` when injecting document content into the webview, so a markdown file containing `</script>` no longer loads blank
- Align all wording to "Editor Markdown Notes"

## [0.1.0]

- Initial release
