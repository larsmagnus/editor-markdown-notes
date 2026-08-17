#!/usr/bin/env bash
set -euo pipefail

# Regenerates public/screenshot-editor-markdown-notes.png without a human
# driving VSCode: launches the same throwaway profile as
# open-clean-vscode-profile.sh, opens public/markdown-notes-architect.md
# (the fixture written to look good above the fold), then captures the
# window - traffic lights, rounded corners, drop shadow and all, the same
# look as Cmd+Shift+4 -> Space -> click - non-interactively.
#
# The clean-profile window is found by PID, never by window title or
# "window 1" of the Code process. If you have a real VSCode window open on
# this same repo/file, its title is indistinguishable from the clean
# profile's - title matching picked the wrong window twice during
# development and sent keystrokes into a real session. A PID match is
# unambiguous because the clean profile always launches as its own Electron
# process (separate --user-data-dir). For the same reason this script closes
# only that one process at the end (Cmd+Q sent to it specifically), never a
# blanket `quit` of the Code application, which would close every window.
#
# Full width and Text Tools are set by seeding the extension's own
# globalState (see SEED_GLOBAL_STATE_SQL below) rather than driving the
# command palette - typing a command name and hitting Return there proved
# unreliable (focus/timing races repeatedly sent the keystrokes to Quick
# Open or even the Dock instead). VSCode stores every globalState key an
# extension has ever set as ONE JSON blob under a row keyed by the
# extension's id (publisher.name, "larsmagnus.editor-markdown-notes" here) -
# not one row per key - confirmed by toggling a real setting through the UI
# and inspecting the resulting state.vscdb; a row keyed by our own memento
# key name (the first thing tried) left the real key untouched and, for
# reasons never fully pinned down, made the custom editor fail to load
# entirely (files opened in the plain text editor instead). Only closing the
# Explorer sidebar still goes through a keystroke (Cmd+B), because there is
# no setting for it (see open-clean-vscode-profile.sh) - that one keystroke
# has been reliable across every run so far.
#
# One-time prerequisite: the terminal running this script needs Accessibility
# permission (System Settings -> Privacy & Security -> Accessibility) so
# System Events can move the VSCode window and send it keystrokes.
# There's no way to grant this from the script itself.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/screenshot-editor-markdown-notes.png"
# Must match CLEAN/USER_DIR/EXT_DIR in open-clean-vscode-profile.sh.
USER_DIR="/tmp/vscode-clean/user"
EXT_DIR="/tmp/vscode-clean/ext"
WINDOW_TITLE_MARKER="markdown-notes-architect.md"

# Fixed window position (points). Left as-is if it doesn't fit the current
# display - screencapture -l crops to the window's actual frame regardless.
WIN_X=80
WIN_Y=80
WIN_W=1600
WIN_H=1040

export SEED_GLOBAL_STATE_SQL="
  INSERT INTO ItemTable (key, value) VALUES (
    'larsmagnus.editor-markdown-notes',
    '{\"editorMarkdownNotes.viewOptions\":{\"raw\":false,\"fullWidth\":true,\"theme\":\"system\",\"textTools\":true,\"textToolRules\":[\"passive\",\"simplify\",\"intensify\",\"readability\"]}}'
  );
"

"$ROOT/scripts/open-clean-vscode-profile.sh" "$ROOT/public/markdown-notes-architect.md"

# Find the clean profile's own Electron process - the one line whose argv
# has --user-data-dir set to our throwaway profile and no --type= flag
# (helper/renderer/gpu processes inherit --user-data-dir too, but only the
# main process is what owns the window).
echo "Waiting for the clean-profile VSCode process..."
PID=""
for _ in $(seq 1 30); do
  PID="$(ps -eo pid,command | grep -- "--user-data-dir $USER_DIR" | grep -v -- "--type=" | grep -v grep | awk '{print $1}' | head -1)"
  [ -n "$PID" ] && break
  sleep 1
done
[ -n "$PID" ] || {
  echo "Timed out waiting for a VSCode process using $USER_DIR" >&2
  exit 1
}

# Poll until that process actually owns a window (webview render takes a
# moment past process start).
for _ in $(seq 1 30); do
  hasWindow="$(osascript -e "
    tell application \"System Events\"
      return (count of windows of (first process whose unix id is $PID)) > 0
    end tell
  " 2>/dev/null || echo false)"
  [ "$hasWindow" = "true" ] && break
  sleep 1
done
[ "$hasWindow" = "true" ] || {
  echo "Timed out waiting for the clean-profile window (pid $PID) to render" >&2
  exit 1
}

# Give the extension host a head start before touching the window at all.
sleep 5

# A file can open in VSCode's plain text editor if the window is still
# resolving `workbench.editorAssociations` before the extension has finished
# registering its custom editor - a one-time decision for that tab that
# doesn't retroactively swap once activation completes later, no matter how
# long you then wait. Only reproduces with the seed above in place (a
# heavier first render - full width layout plus an immediate Text Tools
# pass - apparently makes the window more likely to lose that race).
# Closing the tab and reopening the same file against the now-definitely-
# activated extension is what actually fixes it, deterministically, instead
# of guessing at a long-enough sleep.
osascript -e "
  tell application \"System Events\"
    set targetProcess to first process whose unix id is $PID
    set frontmost of targetProcess to true
    tell targetProcess to keystroke \"w\" using command down
  end tell
"
sleep 1
code --user-data-dir "$USER_DIR" --extensions-dir "$EXT_DIR" \
  --reuse-window "$ROOT" "$ROOT/public/markdown-notes-architect.md"
sleep 5

# Written to temp files rather than piped straight into $(osascript <<OSA):
# bash's command-substitution parser mis-scans an apostrophe inside a heredoc
# nested in $(...) as starting a quoted string, breaking the whole script.
POSITION_SCRIPT="$(mktemp -t screenshot-position.scpt)"
WINDOW_ID_SCRIPT="$(mktemp -t screenshot-window-id.js)"
trap 'rm -f "$POSITION_SCRIPT" "$WINDOW_ID_SCRIPT"' EXIT

cat > "$POSITION_SCRIPT" <<OSA
tell application "System Events"
  set targetProcess to first process whose unix id is $PID
  set frontmost of targetProcess to true
  set targetWindow to window 1 of targetProcess
  perform action "AXRaise" of targetWindow
  delay 0.3
  set position of targetWindow to {$WIN_X, $WIN_Y}
  set size of targetWindow to {$WIN_W, $WIN_H}
  delay 0.5

  tell targetProcess
    -- Close the Explorer sidebar; there is no setting for this, only the
    -- keybinding (see open-clean-vscode-profile.sh).
    keystroke "b" using command down
    delay 0.3
  end tell

  -- A plain keystroke here lands on the window, not necessarily inside the
  -- webview's contentEditable - Cmd+Up silently did nothing until a real
  -- click established focus on the editor content first.
  click at {$WIN_X + 400, $WIN_Y + 300}
  delay 0.3

  tell targetProcess
    -- Scroll the note back to the top - the editor otherwise keeps whatever
    -- scroll/cursor position the file last had. Cmd+Up is the macOS "move
    -- to start of document" shortcut Chromium webviews honor.
    key code 126 using command down
  end tell
end tell
OSA

osascript "$POSITION_SCRIPT"

# Let the webview settle after the scroll/resize before capturing.
sleep 2

# System Events' AX tree doesn't expose a window number on this VSCode
# build (no AXWindowNumber attribute), so the CGWindowID screencapture -l
# needs comes from Quartz's own window list instead. Plain JXA array
# bridging (ObjC.deepUnwrap on the list itself) silently returns a
# non-array object here; going through CFArrayGetCount/CFArrayGetValueAtIndex
# and casting each element explicitly is what actually works.
#
# Electron registers several same-PID, same-layer helper surfaces alongside
# the real window (a small transparent one was the first layer-0 match by
# PID alone, producing a blank 1000x1000 capture) - matching on the window
# title too, not just PID, is what actually isolates the real document
# window.
cat > "$WINDOW_ID_SCRIPT" <<JS
ObjC.import('CoreGraphics')
ObjC.import('CoreFoundation')
var pid = $PID
var windowList = \$.CGWindowListCopyWindowInfo(0, 0)
var count = \$.CFArrayGetCount(windowList)
var found = null
for (var i = 0; i < count; i++) {
  var info = ObjC.deepUnwrap(ObjC.castRefToObject(\$.CFArrayGetValueAtIndex(windowList, i)))
  var name = info ? info['kCGWindowName'] : null
  if (info && info['kCGWindowOwnerPID'] === pid && info['kCGWindowLayer'] === 0 && name && name.indexOf('$WINDOW_TITLE_MARKER') !== -1) {
    found = info['kCGWindowNumber']
    break
  }
}
found
JS

WINDOW_ID="$(osascript -l JavaScript "$WINDOW_ID_SCRIPT")"
[ -n "$WINDOW_ID" ] && [ "$WINDOW_ID" != "null" ] || {
  echo "Could not find a Quartz window id for pid $PID" >&2
  exit 1
}

echo "Capturing $OUT (window id: $WINDOW_ID)"
screencapture -x -l"$WINDOW_ID" "$OUT"

# Quit only this process (Cmd+Q sent while it's frontmost) - never the whole
# Code application, which would also close any real windows you have open.
osascript -e "
  tell application \"System Events\"
    set targetProcess to first process whose unix id is $PID
    set frontmost of targetProcess to true
    tell targetProcess to keystroke \"q\" using command down
  end tell
" >/dev/null 2>&1 || true

echo "Done: $OUT"
