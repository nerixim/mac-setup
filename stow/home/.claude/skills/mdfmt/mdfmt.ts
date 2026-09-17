#!/usr/bin/env bun
// Markdown の表記lintと整形。GitHub/Backlog に出す本文と、Slack に貼る下書きで規則が違うので、送る前にここで止める。
// 依存は bun だけ。テストだけ vitest を使う(このディレクトリで bun install)。
import { readFileSync, writeFileSync } from "node:fs"
import { fixGithubMarkdown, lint } from "./lint.ts"
import { lintSlack, toSlackMrkdwn } from "./slack.ts"

const USAGE = `Usage: bun ~/.claude/skills/mdfmt/mdfmt.ts [--slack] [--fix] [--docs] <file.md>... | -

  <file.md>...             GitHub/Backlog の表記をlint(違反があれば exit 1)
  --fix <file.md>...       機械的に直せる分だけ上書き(全角/半角の空白・#123・閉じ強調)
  --docs <file.md>...      上に加えて末尾の「最終更新日: YYYY-MM-DD」も見る
  --slack <file.md>...     Slack の下書きとしてlint(表・**・見出し・[](URL)・2段落)
  --slack --fix <file>...  Slack mrkdwn に変換して上書き(表は畳めないので残す)
  -                        標準入力を読み、--fix の結果を標準出力へ出す

直さないもの: 斜体・太字の多さ・段落数は判断が要るので lint が出すだけ。`

type Finding = { file: string; line: number; rule: string; text: string; hint: string }

const argv = process.argv.slice(2)
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(USAGE)
  process.exit(0)
}

const KNOWN = new Set(["--slack", "--fix", "--docs"])
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

const read = (file: string): string => (file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8"))
const label = (file: string): string => (file === "-" ? "(stdin)" : file)
const check = (content: string): Omit<Finding, "file">[] => (slack ? lintSlack(content) : lint(content, { docs }))

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
  console.error(`${slack ? "slack" : "markdown"}: clean (${files.length} file(s)${fix ? ", fixed" : ""})`)
  process.exit(0)
}

console.error(`${findings.length} finding(s)${fix ? " left after --fix" : ""}:`)
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line} [${finding.rule}] ${finding.text}`)
  console.error(`    -> ${finding.hint}`)
}
process.exit(1)
