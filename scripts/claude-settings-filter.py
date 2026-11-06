#!/usr/bin/env python3
"""git clean filter for stow/home/.claude/settings.json.

Claude Code rewrites `model`, `modelSettings`, `effortLevel` and `fastMode` whenever /model, /effort or /fast is
confirmed (code.claude.com/docs/en/model-config, read 2026-11-07), and the docs give no way to stop that write. The
stowed file is the live file, so every pick on one machine became a diff on every machine. This filter drops those
keys on the way into the index: the working file keeps the pick, the repo never sees it. Wired by .gitattributes
(filter=claude-settings) and scripts/stow.sh (git config filter.claude-settings.clean). Input that is not JSON
passes through unchanged, so a broken file still commits and shows up in review instead of being hidden.
"""
import json
import sys

STRIP = ("model", "modelSettings", "effortLevel", "fastMode")
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except ValueError:
    sys.stdout.write(raw)
    sys.exit(0)
for key in STRIP:
    data.pop(key, None)
sys.stdout.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
