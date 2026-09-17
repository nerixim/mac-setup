// Slack に貼る下書きのチェックと、GitHub風 Markdown → Slack mrkdwn の変換。
// Slack は表も見出しも `**強調**` も描画しない(`**` がそのまま出る)。崩れた記法を送る前にここで止める。
// 下書きファイルの最初の `---` から下は「聞かれたら出す詳細」として長さの数え方から外す。
import {
  isSlackTight,
  mapOutsideFences,
  padSlackCodeSpans,
  padSlackEmphasis,
  SLACK_EMPHASIS_MARKERS,
  slackPairPattern,
} from "./emphasis.ts"

export type SlackRule =
  | "slack-table"
  | "slack-bold"
  | "slack-heading"
  | "slack-link"
  | "slack-strike"
  | "slack-boundary"
  | "slack-length"

export type SlackViolation = { line: number; rule: SlackRule; text: string; hint: string }

const TABLE = /^\s*\|.*\|\s*$/
const HEADING = /^#{1,6}\s/
const MD_BOLD = /\*\*[^*\n]+\*\*|__[^_\n]+__/
const MD_LINK = /\[[^\]\n]+\]\([^)\n]+\)/
const MD_STRIKE = /~~[^~\n]+~~/
const CODE_SPAN = /(?<!`)`([^`\n]+)`(?!`)/g
const SLACK_SPANS = [...SLACK_EMPHASIS_MARKERS.map(slackPairPattern), CODE_SPAN]

/** 下書きのうち、Slack に貼る本文(最初の `---` より上)だけを返す */
export const slackBody = (content: string): string => {
  const lines = content.split("\n")
  const cut = lines.findIndex((line) => /^\s*---\s*$/.test(line))
  return cut === -1 ? content : lines.slice(0, cut).join("\n")
}

/** 空行で区切られた段落の数。コードフェンスは1段落として数える */
export const countParagraphs = (body: string): number => {
  let count = 0
  let inParagraph = false
  let inFence = false
  for (const raw of body.split("\n")) {
    const line = raw.trim()
    if (line.startsWith("```")) {
      inFence = !inFence
    }
    if (line.length === 0 && !inFence) {
      inParagraph = false
      continue
    }
    if (!inParagraph) {
      count += 1
      inParagraph = true
    }
  }
  return count
}

/** `*` や `` ` `` が日本語に密着していて、Slack が整形せずに記号のまま出す箇所があるか */
export const hasSlackBoundaryProblem = (line: string): boolean => {
  const around = (match: string, offset: number, source: string): boolean => {
    const before = offset === 0 ? undefined : source.at(offset - 1)
    const after = source.at(offset + match.length)
    return isSlackTight(before) || isSlackTight(after)
  }
  for (const pattern of SLACK_SPANS) {
    for (const match of line.matchAll(pattern)) {
      if (around(match[0], match.index, line)) {
        return true
      }
    }
  }
  return false
}

export const lintSlack = (content: string): SlackViolation[] => {
  const body = slackBody(content)
  const hits: SlackViolation[] = []
  let inFence = false
  let inTable = false

  for (const [index, raw] of body.split("\n").entries()) {
    const line = raw.replace(/\r$/, "")
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      continue
    }
    const at = (rule: SlackRule, hint: string): SlackViolation => ({ line: index + 1, rule, text: line.trim(), hint })

    // 表は塊ごとに1回だけ出す(3行の表で3件出しても直し方は変わらない)
    const wasTable = inTable
    inTable = TABLE.test(line)
    if (inTable && !wasTable) {
      hits.push(
        at("slack-table", "Slack does not render tables; rebuild as short lines and put the detail in the ticket"),
      )
    }
    if (HEADING.test(line)) {
      hits.push(at("slack-heading", "Slack does not render headings; use a `*heading*` line"))
    }
    if (MD_BOLD.test(line)) {
      hits.push(at("slack-bold", "Slack bold is `*one star*`; `**` is printed literally"))
    }
    if (MD_LINK.test(line)) {
      hits.push(at("slack-link", "`[text](url)` is not rendered; use `<url|text>`"))
    }
    if (MD_STRIKE.test(line)) {
      hits.push(at("slack-strike", "Slack strikethrough is `~one tilde~`"))
    }
    if (hasSlackBoundaryProblem(line)) {
      hits.push(
        at("slack-boundary", "`*` or `` ` `` touching Japanese is left unformatted; pad it with a halfwidth space"),
      )
    }
  }

  const paragraphs = countParagraphs(body)
  if (paragraphs > 2) {
    hits.push({
      line: body.split("\n").length,
      rule: "slack-length",
      text: `(段落 ${paragraphs})`,
      hint: "a chat reply is two paragraphs at most; put dropped detail below `---` or in a separate message",
    })
  }

  return hits.sort((a, b) => a.line - b.line)
}

/** `**` を一旦この文字に退避してから、GFMの斜体 `*x*` を `_x_` に変える(取り違えを避ける) */
const BOLD_TOKEN = "\u0001"

const convertInline = (prose: string): string =>
  prose
    .replace(/\*\*\*([^*\n]+?)\*\*\*/g, `${BOLD_TOKEN}_$1_${BOLD_TOKEN}`)
    .replace(/\*\*([^*\n]+?)\*\*/g, `${BOLD_TOKEN}$1${BOLD_TOKEN}`)
    .replace(/(?<![\w_])__([^_\n]+?)__(?![\w_])/g, `${BOLD_TOKEN}$1${BOLD_TOKEN}`)
    .replace(/(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)/g, "_$1_")
    .replace(/~~([^~\n]+?)~~/g, "~$1~")
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, "<$2|$1>")
    .replaceAll(BOLD_TOKEN, "*")

const convertLine = (line: string): string => {
  const heading = line.match(/^#{1,6}\s+(.*)$/)
  if (heading) {
    // 見出しの中の `**` は落とす。太字の入れ子は Slack に無く、退避した印と衝突する
    return `${BOLD_TOKEN}${(heading[1] ?? "").replace(/\*\*|__/g, "").trim()}${BOLD_TOKEN}`
  }
  return line.replace(/^(\s*)[-*+]\s+/, "$1• ")
}

/**
 * GitHub風 Markdown を Slack mrkdwn にする。表だけは機械的に畳めないのでそのまま残す
 * (lintSlack が `slack-table` で出すので、人が短い行に組み替える)。
 */
export const toSlackMrkdwn = (content: string): string =>
  padSlackCodeSpans(
    padSlackEmphasis(
      mapOutsideFences(content, (segment) => segment.split("\n").map(convertLine).join("\n"))
        .split(/(```[\s\S]*?```|`[^`\n]+`|<https?:\/\/[^>\n]+>)/g)
        .map((part, index) => (index % 2 === 1 ? part : convertInline(part)))
        .join(""),
    ),
  )
