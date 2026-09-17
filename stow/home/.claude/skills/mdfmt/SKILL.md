---
name: mdfmt
description: Lint or format Markdown before it goes out - a Slack draft (tables, **, headings, [text](url), paragraph count, mrkdwn conversion) or a Backlog/GitHub body (fullwidth/halfwidth spacing, closing emphasis, italics in Japanese, bold density). Use before posting a draft, an issue, a PR body or a comment, and when asked to check or fix Markdown notation.
---

# mdfmt

Two registers, two rule sets. Run the one that matches where the text is going.

## Slack draft

```bash
bun ~/.claude/skills/mdfmt/mdfmt.ts --slack <draft.md>        # lint
bun ~/.claude/skills/mdfmt/mdfmt.ts --slack --fix <draft.md>  # convert to mrkdwn in place
cat draft.md | bun ~/.claude/skills/mdfmt/mdfmt.ts --slack --fix -
```

Finds: markdown tables and headings (Slack renders neither), `**bold**` (Slack is
`*one star*`), `[text](url)` (Slack is `<url|text>`), `~~strike~~`, `*` or a code
span pressed against Japanese so Slack leaves the marker visible, and more than
two paragraphs.

`--fix` converts headings to a bold line, bullets to `•`, links to `<url|text>`,
and pads the markers. Tables are left alone on purpose: rebuilding one as short
lines is a judgement call, so the lint keeps reporting it.

Everything below the first `---` in the draft is treated as detail you keep back,
not part of the message, and is not counted toward the two-paragraph ceiling.

## Backlog / GitHub body

```bash
bun ~/.claude/skills/mdfmt/mdfmt.ts <file.md>          # lint
bun ~/.claude/skills/mdfmt/mdfmt.ts --fix <file.md>    # mechanical fixes in place
bun ~/.claude/skills/mdfmt/mdfmt.ts --docs <file.md>   # also require a trailing 最終更新日:
```

Finds: a space between fullwidth and halfwidth characters (`#123` excepted, where
the spaces are required for the autolink), a closing `**` that CommonMark will not
accept because the content ends in punctuation and a character follows, italics
around Japanese, and the third bold span under one heading.

`--fix` only touches the mechanical part: the spacing, the `#123` padding, the
closing `**`, and `` `fixes #12` `` unwrapped so GitHub links it. Italics and bold
density are reported, never rewritten.

## Scope

Code spans, fenced blocks, link destinations and URLs are masked everywhere, so a
command or an identifier inside backticks is never flagged or rewritten.

Word choice is a separate concern; this does not touch it.

## Tests

```bash
cd ~/.claude/skills/mdfmt && bun test
```

No dependencies: `bun test`, not vitest, so the directory holds no
`node_modules`. Stow links every file under `stow/home/` into `$HOME`
one by one, and a dependency tree here would be linked file by file too.
