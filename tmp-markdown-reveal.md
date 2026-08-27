# Bugs

Note: 🟠 items have a temporary bugfix applied by me. Must be checked and cleaned up.

🟠 Headings - backspacing to delete the last heading level `#` adds one more `#` making it impossible to unwrap headings/make headings into paragraphs

Bold, italic, strikethrough, inline code blocks etc. - Deleting a formatting symbol, e.g `*` or `_` or `~` etc immediately restores it, making it impossible to unformat text by backspacing alone. Note: for some reason this seems to work as expected with block quotes - can we re-use some logic from this?

Additional finding on the above: immediately after writing text that is formatted it is possible to backspace as expected, however if a space is added after the last formatting symbol the bug above re-appears. i.e backspacing at `_italic_` vs `_italic_`

Ordered and unordered lists: when the caret is at the start position and the markdown revealed, the rendered bullet and number is still visible. Only one should be revealed at the same time, exactly like in task lists (i.e when `- [ ]` is revealed the rendered checkbox is hidden)

Task list: Making a text selection over `- [ ]` and pressing backspace does not delete the selection - it's still shown. Pressing backspace a second time deletes the whole selection. It should be deleted on the first.

Code blocks (triple backticks) and mermaid diagram source: unwrapping code block by deleting backticks isn't possible. deleting the backticks seem to work, however after they are deleted new triple backticks (top and bottom) appear. Deleting these also seem to work, but when the last backtick is deleted, new triple backticks re-appear. It must be possible to delete them and unwrap the code block.

🟠 Image: deleting the markdown in the input field doesn't do anything. Upon deleting the markdown in the input field and pressing enter/return the old markdown re-appears. The markdown (and image) should be deleted. Consider wrapping image source field with a form element to leverage native submit functionality on enter.

Links: deleting the markdown with backspace doesn't work. Once the opening `(` is deleted the original link markdown re-appears and a duplicate closing `]` is added resulting in e.g this `[link with a title]](https://example.com "Example Domain")`

Horizontal rules/breaks: these don't seem editable at all - was it ever implemented? Similar to obsidian, moving the caret to a horizontal break should reveal --- which must be editable

## 🔨 Bugfixes

These must be checked

- Deleting image markdown
- Deleting heading markdown
