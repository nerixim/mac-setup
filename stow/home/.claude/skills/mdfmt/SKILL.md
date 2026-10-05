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
span pressed against Japanese so Slack leaves the marker visible, a commit SHA
that is not a link, and more than two paragraphs.

`--fix` converts headings to a bold line, bullets to `•`, links to `<url|text>`,
and pads the markers. Tables are left alone on purpose: rebuilding one as short
lines is a judgement call, so the lint keeps reporting it.

Everything below the first `---` in the draft is treated as detail you keep back,
not part of the message, and is not counted toward the two-paragraph ceiling.

## Backlog / GitHub body

```bash
bun ~/.claude/skills/mdfmt/mdfmt.ts <file.md>          # lint
bun ~/.claude/skills/mdfmt/mdfmt.ts --fix <file.md>    # mechanical fixes in place
bun ~/.claude/skills/mdfmt/mdfmt.ts --backlog <file.md>  # Backlog body: also flag unlinked commit SHAs
bun ~/.claude/skills/mdfmt/mdfmt.ts --docs <file.md>   # repo docs: unlinked SHAs and a trailing 最終更新日:
bun ~/.claude/skills/mdfmt/mdfmt.ts --en <file.md>     # also check English prose for packing
```

A bare SHA is flagged only with `--backlog`, `--docs` and `--slack`. GitHub links a
same-repo SHA by itself inside issues, PRs and comments, so the default (GitHub)
mode leaves it alone. Only SHAs mixing digits and `a-f` count; an all-digit SHA
prefix reads as a number and is missed on purpose.

Finds: a space between fullwidth and halfwidth characters inside Japanese prose (`#123` excepted, where
the spaces are required for the autolink; English sentences quoting a Japanese word keep their spaces, judged per table cell), a `**` that GitHub leaves literal because
its inner side is punctuation, a bracket, a code span or a link and its outer side
is a letter (`**強調。**続き`, `これは**「語」**です`, ``設定は**`foo`**に``), italics
around Japanese, and the third bold span under one heading.

`--fix` only touches the mechanical part: the spacing, the `#123` padding, a
space on the letter side of a literal `**`, and `` `fixes #12` `` unwrapped so GitHub
links it. A `**` around a link is reported but not padded. Italics and bold
density are reported, never rewritten.

`--en` adds two checks on English prose only (a paragraph, a list item or a table
cell with at least five English words): a sentence over 30 words
(`en-long-sentence`) and two or more semicolons in one block
(`en-semicolon-chain`). It is opt-in, so `lint-draft` and the `gh` post gate do
not run it. Nothing is rewritten.

## Scope

Code spans, fenced blocks, link destinations and URLs are masked everywhere, so a
command or an identifier inside backticks is never flagged or rewritten.

Word choice is a separate concern; this does not touch it. `--en` counts words and semicolons, not which words.

## Tests

```bash
cd ~/.claude/skills/mdfmt && bun test
```

No dependencies: `bun test`, not vitest, so the directory holds no
`node_modules`. Stow links every file under `stow/home/` into `$HOME`
one by one, and a dependency tree here would be linked file by file too.
