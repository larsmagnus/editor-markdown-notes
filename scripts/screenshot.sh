#!/usr/bin/env bash
set -euo pipefail

# Regenerates public/screenshot-editor-markdown-notes.png headlessly: opens
# the fixture note in the clean profile, then captures the window natively
# (traffic lights, shadow) the way a manual Cmd+Shift+4 capture would.
#
# Targets the window by PID, never title/"window 1" - a real VSCode window on
# the same file has an identical title, and title matching once sent
# keystrokes into a real session. Only this PID gets Cmd+Q'd at the end.
#
# fullWidth/Text Tools are set by seeding globalState directly
# (SEED_GLOBAL_STATE_SQL) - the command palette route was flaky. See
# open-clean-vscode-profile.sh for the storage shape.
#
# One-time prerequisite: the terminal needs Accessibility and Screen
# Recording (System Settings -> Privacy & Security) - neither can be granted
# from here. Missing Screen Recording fails as "Could not find a Quartz
# window id", not as a permission error.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/screenshot-editor-markdown-notes.png"
# Must match CLEAN/USER_DIR/EXT_DIR in open-clean-vscode-profile.sh.
USER_DIR="/tmp/vscode-clean/user"
EXT_DIR="/tmp/vscode-clean/ext"
FIXTURE="$ROOT/public/markdown-notes-architect.md"
WINDOW_TITLE_MARKER="$(basename "$FIXTURE")"

# Fixed window position (points); screencapture -l crops to the window's
# actual frame regardless, so this doesn't need to fit every display.
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

"$ROOT/scripts/open-clean-vscode-profile.sh" "$FIXTURE"

# Matched on the main binary (.../MacOS/Code) + --user-data-dir, not just PID
# order: the crashpad handler also carries our profile path (via --database=)
# with no --type= of its own, so PID ordering alone could pick it instead.
echo "Waiting for the clean-profile VSCode process..."
PID=""
for _ in $(seq 1 30); do
  # `|| true`: a bare assignment failing here would kill the script outright
  # under set -e + pipefail on the first "no match" iteration.
  PID="$(ps -eo pid,command | grep -E "/MacOS/(Code|Electron) .*--user-data-dir" | grep -- "vscode-clean/user" | grep -v -- "--type=" | grep -v grep | awk '{print $1}' | head -1 || true)"
  [ -n "$PID" ] && break
  sleep 1
done
[ -n "$PID" ] || {
  echo "Timed out waiting for a VSCode process using $USER_DIR" >&2
  exit 1
}

# stderr is captured, not discarded, so a real osascript failure is visible
# instead of looking identical to "still rendering".
lastErr=""
hasWindow=false
for _ in $(seq 1 45); do
  if out="$(osascript -e "
    tell application \"System Events\"
      return (count of windows of (first process whose unix id is $PID)) > 0
    end tell
  " 2>&1)"; then
    hasWindow="$out"
    [ "$hasWindow" = "true" ] && break
  else
    lastErr="$out"
  fi
  sleep 1
done
[ "$hasWindow" = "true" ] || {
  echo "Timed out waiting for the clean-profile window (pid $PID) to render" >&2
  [ -n "$lastErr" ] && echo "Last osascript error: $lastErr" >&2
  exit 1
}

# Give the extension host a head start before touching the window at all.
sleep 5

# Closing and reopening the tab guards against the file having opened before
# the extension finished activating - a one-time, non-retroactive decision.
osascript -e "
  tell application \"System Events\"
    set targetProcess to first process whose unix id is $PID
    set frontmost of targetProcess to true
    tell targetProcess to keystroke \"w\" using command down
  end tell
" || {
  echo "Failed to send Cmd+W to pid $PID" >&2
  exit 1
}
sleep 1
code --user-data-dir "$USER_DIR" --extensions-dir "$EXT_DIR" \
  --reuse-window "$ROOT" "$FIXTURE" || {
  echo "'code --reuse-window' failed" >&2
  exit 1
}
sleep 5

# Written to temp files, not piped into $(osascript <<OSA): an apostrophe in
# a heredoc nested in $(...) breaks bash's parser.
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
    -- No setting for closing the Explorer; only the keybinding.
    keystroke "b" using command down
    delay 0.3
  end tell
end tell
OSA

positionErr="$(osascript "$POSITION_SCRIPT" 2>&1)" || {
  echo "Failed to position/resize the window or close the Explorer sidebar" >&2
  echo "osascript error: $positionErr" >&2
  exit 1
}

# Let the webview settle after the resize before capturing.
sleep 2

# No AXWindowNumber on this VSCode build, so the CGWindowID comes from
# Quartz's window list instead (ObjC.deepUnwrap on the list itself silently
# returns a non-array object). Matched on title too, not just PID: Electron
# also registers same-PID helper surfaces alongside the real window.
cat > "$WINDOW_ID_SCRIPT" <<JS
ObjC.import('CoreGraphics')
ObjC.import('CoreFoundation')
var pid = $PID
var windowList = \$.CGWindowListCopyWindowInfo(0, 0)
var count = \$.CFArrayGetCount(windowList)
var found = null
var candidates = []
for (var i = 0; i < count; i++) {
  var info = ObjC.deepUnwrap(ObjC.castRefToObject(\$.CFArrayGetValueAtIndex(windowList, i)))
  if (!info || info['kCGWindowOwnerPID'] !== pid) continue
  var name = info['kCGWindowName'] || ''
  candidates.push('layer=' + info['kCGWindowLayer'] + ' id=' + info['kCGWindowNumber'] + ' name="' + name + '"')
  if (info['kCGWindowLayer'] === 0 && name.indexOf('$WINDOW_TITLE_MARKER') !== -1) {
    found = info['kCGWindowNumber']
    break
  }
}
JSON.stringify({ found: found, candidates: candidates })
JS

WINDOW_LOOKUP="$(osascript -l JavaScript "$WINDOW_ID_SCRIPT")" || {
  echo "Failed to look up Quartz windows for pid $PID" >&2
  echo "osascript error: $WINDOW_LOOKUP" >&2
  exit 1
}
WINDOW_ID="$(node -e "process.stdout.write(String(JSON.parse(process.argv[1]).found ?? ''))" "$WINDOW_LOOKUP")"
[ -n "$WINDOW_ID" ] && [ "$WINDOW_ID" != "null" ] || {
  echo "Could not find a Quartz window id for pid $PID" >&2
  echo "Windows owned by that pid: $WINDOW_LOOKUP" >&2
  exit 1
}

echo "Capturing $OUT (window id: $WINDOW_ID)"
screencapture -x -l"$WINDOW_ID" "$OUT"

# Quit only this process, never a blanket `quit` of Code (see header).
osascript -e "
  tell application \"System Events\"
    set targetProcess to first process whose unix id is $PID
    set frontmost of targetProcess to true
    tell targetProcess to keystroke \"q\" using command down
  end tell
" >/dev/null 2>&1 || true

echo "Done: $OUT"
