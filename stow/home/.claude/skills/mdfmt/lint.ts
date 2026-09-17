// GitHub/Backlog に出す Markdown の機械的な表記チェックと、機械的に直せる分の修正。
// レビューでしか守られていなかった規則を落とす。判断が要る規則(register・敬語・長さ)はここでは見ない。
import { mapOutsideFences, padCommonMarkEmphasisClosers, withProtectedCodeSpans } from "./emphasis.ts"

export type Rule = "ja-en-space" | "emphasis-boundary" | "ja-italic" | "bold-density" | "last-updated"

export type Violation = { line: number; rule: Rule; text: string; hint: string }

const HALF = "A-Za-z0-9"
const FULL = "\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uff01-\\uff60\\u3001\\u3002\\u300c-\\u300f\\u3010\\u3011"
const JA_EN_SPACE_SOURCE = `([${HALF}]) ([${FULL}])|([${FULL}]) ([${HALF}])`
const JA_EN_SPACE = new RegExp(JA_EN_SPACE_SOURCE)
const JA_EN_SPACE_ALL = new RegExp(JA_EN_SPACE_SOURCE, "g")

const CJK = new RegExp(`[${FULL}]`)
const LAST_UPDATED = /^最終更新日:\s*\d{4}-\d{2}-\d{2}$/

const WHITESPACE = /\s/
/** CommonMark の「punctuation character」(ASCII約物 + Unicode P/S) */
const PUNCTUATION = /[\p{P}\p{S}]/u

const isWhitespace = (char: string | undefined): boolean => char === undefined || WHITESPACE.test(char)
const isPunctuation = (char: string | undefined): boolean => char !== undefined && PUNCTUATION.test(char)

// 閉じられない `**` が行内にあるか。
// CommonMark の right-flanking は「直前が空白でない」かつ「直前が約物でない、または直後が空白か約物」。
// `**太字。**続き` は直前`。`・直後`続`で両方を外すため閉じ記号にならず、`**` がそのまま出る。
// 開き・閉じを交互に追うので、`**A**と**B**` のような連続した強調を誤検知しない。
export const hasUnclosedEmphasis = (line: string): boolean => {
  let open = false

  for (let i = 0; i < line.length - 1; i += 1) {
    if (line[i] !== "*" || line[i + 1] !== "*") {
      continue
    }
    const prev = line[i - 1]
    const next = line[i + 2]

    if (!open) {
      // left-flanking: 直後が空白でなく、(直後が約物でない、または直前が空白か約物)
      if (isWhitespace(next)) {
        continue
      }
      if (!isPunctuation(next) || isWhitespace(prev) || isPunctuation(prev)) {
        open = true
        i += 1
      }
      continue
    }

    if (isWhitespace(prev)) {
      continue
    }
    if (!isPunctuation(prev) || isWhitespace(next) || isPunctuation(next)) {
      open = false
      i += 1
      continue
    }
    return true
  }

  return false
}

/** 行内のコード・リンク先・URL・GitHub参照・HTMLタグを潰す。桁位置は保つ */
export const maskInline = (line: string): string => {
  const blank = (match: string): string => " ".repeat(match.length)
  return (
    line
      .replace(/`[^`]*`/g, blank)
      .replace(/\]\([^)]*\)/g, blank)
      .replace(/https?:\/\/\S+/g, blank)
      // `#123` は前後に半角スペースを入れるのが正(でないと自動リンクされない)。JA/EN空白の例外
      .replace(/#\d+/g, blank)
      .replace(/<[^>]*>/g, blank)
  )
}

const BOLD = /\*\*[^*\n]+\*\*/g
const JA_ITALIC = /(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)|(?<![\w_])_([^_\n]+?)_(?![\w_])/g

const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s+/
const TABLE_ROW = /^\s*\|/
const HEADING = /^#{1,6}\s/

/** 太字の数え方から外す行・箇所を落とす(表のセル・見出し・箇条書きの先頭に置いた太字) */
const boldCountable = (masked: string): string => {
  if (TABLE_ROW.test(masked) || HEADING.test(masked)) {
    return ""
  }
  const marker = masked.match(LIST_ITEM)?.[0]
  return marker === undefined ? masked : masked.slice(marker.length).replace(/^\*\*[^*\n]+\*\*/, "")
}

/** 日本語を斜体にしている箇所があるか。`foo_bar` のようなスネークケースは外す */
const hasJaItalic = (masked: string): boolean =>
  [...masked.matchAll(JA_ITALIC)].some((match) => CJK.test(match[1] ?? match[2] ?? ""))

/** 1行ぶんの、前後の行に依らない規則 */
const lineViolations = (line: string, masked: string): Omit<Violation, "line">[] => {
  const text = line.trim()
  const hits: Omit<Violation, "line">[] = []
  if (JA_EN_SPACE.test(masked)) {
    hits.push({
      rule: "ja-en-space",
      text,
      hint: "no space between fullwidth and halfwidth; `#123` is the only exception",
    })
  }
  if (hasUnclosedEmphasis(masked)) {
    hits.push({ rule: "emphasis-boundary", text, hint: "move the punctuation outside the emphasis: `**太字**。続き`" })
  }
  if (hasJaItalic(masked)) {
    hits.push({ rule: "ja-italic", text, hint: "no italics in Japanese; use bold or rephrase" })
  }
  return hits
}

/** 1ファイル分の行単位チェック。コードフェンス内(mermaid含む)は対象外 */
export const checkLines = (content: string): Violation[] => {
  const hits: Violation[] = []
  let inFence = false
  let boldInSection = 0

  for (const [index, raw] of content.split("\n").entries()) {
    const line = raw.replace(/\r$/, "")
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      continue
    }
    if (HEADING.test(line)) {
      boldInSection = 0
    }

    const masked = maskInline(line)
    for (const hit of lineViolations(line, masked)) {
      hits.push({ line: index + 1, ...hit })
    }

    // 太字は見出しごとに数える。3箇所目に入った行で1回だけ出す。
    // 数えるのは地の文の太字だけ — 箇条書きの先頭の太字と表のセルは別の型なので外す
    const bold = [...boldCountable(masked).matchAll(BOLD)].length
    if (boldInSection < 3 && boldInSection + bold >= 3) {
      hits.push({
        line: index + 1,
        rule: "bold-density",
        text: line.trim(),
        hint: "at most 1-2 bold spans under one heading; split the section or drop the bold",
      })
    }
    boldInSection += bold
  }

  return hits
}

/** 末尾の非空行が `最終更新日: YYYY-MM-DD` か */
export const hasLastUpdated = (content: string): boolean => {
  const last = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .at(-1)
  return last !== undefined && LAST_UPDATED.test(last)
}

export const lint = (content: string, opts: { docs?: boolean } = {}): Violation[] => {
  const hits = checkLines(content)
  if (opts.docs && !hasLastUpdated(content)) {
    hits.push({
      line: content.split("\n").length,
      rule: "last-updated",
      text: "(末尾)",
      hint: "add `最終更新日: YYYY-MM-DD` as the last line",
    })
  }
  return hits.sort((a, b) => a.line - b.line)
}

const GITHUB_REFERENCE = /#\d+\b/g
/** インラインコード全体が closing/ref キーワードだけなら外す(コードにすると GitHub がリンクしない)。 */
const CLOSING_KEYWORD_INLINE_CODE = /`(fixes|closes|resolves|close|fix|resolve|refs)\s*(#\d+)`/gi

const addReferenceSpacing = (text: string): string =>
  text.replace(GITHUB_REFERENCE, (reference, offset: number, source: string) => {
    const previous = offset > 0 ? source.at(offset - 1) : undefined
    const next = source.at(offset + reference.length)
    const prefix = previous && !/\s/.test(previous) ? " " : ""
    const suffix = next && !/\s/.test(next) ? " " : ""
    return `${prefix}${reference}${suffix}`
  })

// `#123` の前後の空白は正(でないと自動リンクされない)なので、そこだけ残して詰める
const dropJaEnSpace = (prose: string): string =>
  prose
    .split(/(#\d+)/g)
    .map((seg, i) => (i % 2 === 1 ? seg : seg.replace(JA_EN_SPACE_ALL, "$1$3$2$4")))
    .join("")

const fixLine = (line: string): string =>
  padCommonMarkEmphasisClosers(
    withProtectedCodeSpans(line.replace(CLOSING_KEYWORD_INLINE_CODE, "$1 $2"), (prose) =>
      addReferenceSpacing(dropJaEnSpace(prose)),
    ),
  )

/**
 * 機械的に直せる分だけ直す。判断が要る違反(ja-italic・bold-density)は lint が出すだけで触らない。
 * - 全角と半角の間のスペースを詰める
 * - `#123` を自動リンク可能な空白区切りにする
 * - `` `fixes #123` `` のコード囲みを外す
 * - 素通しになる閉じ強調の後ろにスペースを入れる
 */
export const fixGithubMarkdown = (markdown: string): string =>
  mapOutsideFences(markdown, (prose) =>
    prose
      .split("\n")
      .map((line) => (/^\s*(```|~~~)/.test(line) ? line : fixLine(line)))
      .join("\n"),
  )
