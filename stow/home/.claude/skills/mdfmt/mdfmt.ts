#!/usr/bin/env bun
// Markdown の表記lintと整形。GitHub/Backlog に出す本文と、Slack に貼る下書きで規則が違うので、送る前にここで止める。
// 依存は bun だけ。テストも bun test。
import { readFileSync, writeFileSync } from "node:fs"
import { fixGithubMarkdown, lint } from "./lint.ts"
import { lintSlack, toSlackMrkdwn } from "./slack.ts"

const USAGE = `Usage: bun ~/.claude/skills/mdfmt/mdfmt.ts [--slack] [--fix] [--docs|--backlog] [--en] <file.md>... | -

  <file.md>...             GitHub/Backlog の表記をlint(違反があれば exit 1)
  --fix <file.md>...       機械的に直せる分だけ上書き(全角/半角の空白・#123・閉じ強調)
  --backlog <file.md>...   Backlog の本文として、リンクにしていないコミットSHAも見る
  --docs <file.md>...      リポジトリの文書として、リンクにしていないコミットSHAと末尾の「最終更新日: YYYY-MM-DD」も見る
  --en <file.md>...        英語の文の詰め込みも見る(1文30語超、1段に `;` が2つ以上)。日本語の文は見ない
  --slack <file.md>...     Slack の下書きとしてlint(表・**・見出し・[](URL)・2段落)
  --slack --fix <file>...  Slack mrkdwn に変換して上書き(表は畳めないので残す)
  -                        標準入力を読み、--fix の結果を標準出力へ出す

直さないもの: 斜体・太字の多さ・段落数・英語の文の長さは判断が要るので lint が出すだけ。`

type Finding = { file: string; line: number; rule: string; text: string; hint: string }

const argv = process.argv.slice(2)
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(USAGE)
  process.exit(0)
}

const KNOWN = new Set(["--slack", "--fix", "--docs", "--backlog", "--en"])
const unknown = argv.filter((arg) => arg.startsWith("--") && !KNOWN.has(arg))
if (unknown.length > 0) {
  console.error(`error: ${unknown.join(" ")} は無い引数`)
  console.error(USAGE)
  process.exit(2)
}

const files = argv.filter((arg) => !arg.startsWith("--"))
if (files.length === 0) {
  console.error(USAGE)
  process.exit(2)
}

const slack = argv.includes("--slack")
const fix = argv.includes("--fix")
const docs = argv.includes("--docs")
const backlog = argv.includes("--backlog")
const en = argv.includes("--en")

// process.stderr.write, not console.error: Bun colors console.error red even when piped, and the
// factcheck bridge (lint-draft W01-W04) matches these lines by regex
const stderr = (line: string): void => {
  process.stderr.write(`${line}\n`)
}

const read = (file: string): string => (file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8"))
const label = (file: string): string => (file === "-" ? "(stdin)" : file)
const check = (content: string): Omit<Finding, "file">[] => (slack ? lintSlack(content) : lint(content, { docs, backlog, en }))

const findings: Finding[] = []
for (const file of files) {
  const before = read(file)
  const after = fix ? (slack ? toSlackMrkdwn(before) : fixGithubMarkdown(before)) : before
  if (fix && file === "-") {
    process.stdout.write(after)
  } else if (fix && after !== before) {
    writeFileSync(file, after)
  }
  findings.push(...check(after).map((hit) => ({ ...hit, file: label(file) })))
}

if (findings.length === 0) {
  stderr(`${slack ? "slack" : "markdown"}: clean (${files.length} file(s)${fix ? ", fixed" : ""})`)
  process.exit(0)
}

stderr(`${findings.length} finding(s)${fix ? " left after --fix" : ""}:`)
for (const finding of findings) {
  stderr(`  ${finding.file}:${finding.line} [${finding.rule}] ${finding.text}`)
  stderr(`    -> ${finding.hint}`)
}
process.exit(1)
