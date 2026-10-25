---
name: mdfmt
description: Lint or format Markdown before it goes out - a Slack draft (tables, **, headings, [text](url), paragraph count, mrkdwn conversion) or a Backlog/GitHub body (fullwidth/halfwidth spacing, closing emphasis, italics in Japanese, bold density). Use before posting a draft, an issue, a PR body or a comment, and when asked to check or fix Markdown notation.
---

# mdfmt

Two registers, two rule sets. Run the one that matches where the text is going.

## Slack draft

```bash
bun ~/.claude/skills/mdfmt/mdfmt.ts --slack <draft.md>        # lint a draft you paste into the composer
bun ~/.claude/skills/mdfmt/mdfmt.ts --slack --fix <draft.md>  # convert to mrkdwn in place
cat draft.md | bun ~/.claude/skills/mdfmt/mdfmt.ts --slack --fix -
bun ~/.claude/skills/mdfmt/mdfmt.ts --slack-api <body.md>     # same, for text posted through the API
```

Finds: markdown tables and headings (Slack renders neither), `**bold**` (Slack is
`*one star*`), `~~strike~~`, `*` or a code span pressed against Japanese so Slack
leaves the marker visible, half-width parens pressed against Japanese (same
`ja-paren` rule as the GitHub mode), a commit SHA that is not a link, and more than
two paragraphs.

Links depend on how the text is sent, so there are two modes. `--slack` is for a
draft pasted into the Slack composer: `[text](url)` becomes a link there, while
`<url|text>` is pasted literally, so the lint flags `<url|text>`. `--slack-api` is
for text posted through `chat.postMessage`, where it is the other way round:
`[text](url)` is not rendered and `<url|text>` is required.

In `--slack`, a `[text](url)` whose `)` is followed directly by text is also flagged
(`slack-link-tail`): the composer's "apply formatting" reads the URL up to the next
space, so `[語](url)の動作確認` swallows everything after `)`. `--fix` puts a
half-width space after the `)`.

`--fix` converts headings to a bold line, pads the markers, and rewrites links for
the chosen mode (`<url|text>` to `[text](url)` under `--slack`, the reverse under
`--slack-api`). `- ` bullets stay as they are under `--slack`, because the composer
turns them into a list on paste; `--slack-api` rewrites them to `•`. Tables are left alone on purpose: rebuilding one
as short lines is a judgement call, so the lint keeps reporting it.

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

The default (GitHub) mode also flags a repo-relative file path that is not a link (`file-link`,
owner 2026-10-26): a code span holding only a path, or a path in prose, such as
`scripts/library.mjs` or `textbook-formats-2026-09-11.md`. Link it as
`[path](https://github.com/<owner>/<repo>/blob/main/<path>)`; a gitignored or local-only file
gets its absolute path. Paths inside a command (`bun scripts/x.mjs run`), absolute paths,
directories, links and URLs pass, and `--backlog`/`--docs` skip the rule. `--fix` does not link,
since it cannot know the repo.

Finds: half-width parens pressed against Japanese (`ja-paren`: Japanese prose uses （）, or puts a
space outside `( )`; `--fix` turns a pair that touches Japanese on either side into （）, leaving
code, link targets, URLs and English prose alone). Finds: a bare commit SHA that GitHub will not autolink because the character before it is Japanese,
fullwidth punctuation, a quote or similar (`sha-spacing`; measured through the markdown API on
2026-10-19: only whitespace, `(`, `[`, `*` and `_` before the SHA keep the link, the character after
it does not matter). Finds: a space between fullwidth and halfwidth characters inside Japanese prose
(`#123` and a bare commit SHA excepted, since the autolink needs that space, so `--fix` adds a space
around `#123` and before a SHA instead of removing it; `#123` excepted, where
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
