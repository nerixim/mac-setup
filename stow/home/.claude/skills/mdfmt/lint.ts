// GitHub/Backlog に出す Markdown の機械的な表記チェックと、機械的に直せる分の修正。
// レビューでしか守られていなかった規則を落とす。判断が要る規則(register・敬語・長さ)はここでは見ない。
import { mapOutsideFences, padCommonMarkEmphasisClosers, withProtectedCodeSpans } from "./emphasis.ts"
import { checkEnglish } from "./english.ts"

export type Rule =
  | "ja-en-space"
  | "emphasis-boundary"
  | "ja-italic"
  | "bold-density"
  | "last-updated"
  | "repo-ref"
  | "bare-sha"
  | "en-long-sentence"
  | "en-semicolon-chain"

export type Violation = { line: number; rule: Rule; text: string; hint: string }

const HALF = "A-Za-z0-9"
const FULL = "\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uff01-\\uff60\\u3001\\u3002\\u300c-\\u300f\\u3010\\u3011"
const JA_EN_SPACE_SOURCE = `([${HALF}]) ([${FULL}])|([${FULL}]) ([${HALF}])`
const JA_EN_SPACE = new RegExp(JA_EN_SPACE_SOURCE)
const JA_EN_SPACE_ALL = new RegExp(JA_EN_SPACE_SOURCE, "g")

const CJK = new RegExp(`[${FULL}]`)
const JA_QUOTED = /「[^」]*」|『[^』]*』/g
const LATIN_WORD = /[A-Za-z]+/g
const LAST_UPDATED = /^最終更新日:\s*\d{4}-\d{2}-\d{2}$/

const WHITESPACE = /\s/
/** CommonMark の「punctuation character」(ASCII約物 + Unicode P/S) */
const PUNCTUATION = /[\p{P}\p{S}]/u

const isWhitespace = (char: string | undefined): boolean => char === undefined || WHITESPACE.test(char)
const isPunctuation = (char: string | undefined): boolean => char !== undefined && PUNCTUATION.test(char)

// 開けない・閉じられない `**` が行内にあるか。GitHub は `**` をそのまま表示する(2026-10-05 に API で確認)。
// CommonMark の left-flanking は「直後が空白でない」かつ「直後が約物でない、または直前が空白か約物」。
// right-flanking はその鏡像。`**太字。**続き` は閉じが、`これは**「語」**です` は開きも閉じも外れる。
// 判定は `*` の連なり(run)の外側の文字で行うので、`これは***強調***です` を誤検知しない。
// 開き・閉じを交互に追うので、`**A**と**B**` のような連続した強調も誤検知しない。
export const hasUnclosedEmphasis = (line: string): boolean => {
  let open = false

  for (const run of line.matchAll(/\*{2,}/g)) {
    const prev = line[run.index - 1]
    const next = line[run.index + run[0].length]

    if (!open) {
      if (isWhitespace(next)) {
        continue
      }
      if (isPunctuation(next) && !isWhitespace(prev) && !isPunctuation(prev)) {
        return true
      }
      open = true
      continue
    }

    if (isWhitespace(prev)) {
      continue
    }
    if (!isPunctuation(prev) || isWhitespace(next) || isPunctuation(next)) {
      open = false
      continue
    }
    return true
  }

  return false
}

/** 強調の判定用。コードスパンとリンク先は GitHub が約物として扱うので、空白ではなく約物で埋める */
export const maskForEmphasis = (line: string): string => {
  const blank = (match: string): string => " ".repeat(match.length)
  return line
    .replace(/`[^`]*`/g, (match) => "`".repeat(match.length))
    .replace(/\]\([^)]*\)/g, (match) => ")".repeat(match.length))
    .replace(/https?:\/\/\S+/g, blank)
    .replace(/<[^>]*>/g, blank)
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

// 日英スペースの規則は日本語の文だけに効く。英文が日本語の語を引くとき(`a mark for 文法`)は空白が正で、
// 詰めると `lifetime伊検applicants` になる(2026-09-27、meta #214)。
// 判定(「」『』の中は除く): 日本語の連なりが段の端に届けば日本語の文。ただし端の連なりにひらがなが無く
// 英単語が3つ以上ある段(`... note.com 学習ジャーナル`)は、名詞を引いた英文と見る。
// 連なりがどれも英字・空白・約物に挟まれた「島」なら英文
const CJK_RUN = new RegExp(`[${FULL}]+`, "g")
const HIRAGANA = /[\u3041-\u309f]/
export const isJapaneseProse = (segment: string): boolean => {
  const text = segment.replace(JA_QUOTED, " ").trim()
  const latinWords = (text.match(LATIN_WORD) ?? []).length
  if (latinWords === 0) {
    return true
  }
  return [...text.matchAll(CJK_RUN)].some((run) => {
    const touchesEdge = run.index === 0 || run.index + run[0].length === text.length
    return touchesEdge && (HIRAGANA.test(run[0]) || latinWords < 3)
  })
}

/** 表の行はセルごと、それ以外は行ごとに文の言語を見る */
const segments = (line: string): string[] => (TABLE_ROW.test(line) ? line.split("|") : [line])

const hasJaEnSpace = (masked: string): boolean =>
  segments(masked).some((seg) => isJapaneseProse(seg) && JA_EN_SPACE.test(seg))

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

// GitHubは `#12` と `owner/repo#12` を自動リンクするが、`repo#12` はしない(2026-09-25、meta #172 の `kanyomi#160`)
const SHORT_REPO_REF = /(?<![\w./#-])[A-Za-z][\w.-]*#\d+\b/

/** `repo#12` のようにオーナーを欠いた他リポジトリ参照があるか。コード・URL・リンク先は見ない */
export const hasShortRepoRef = (line: string): boolean =>
  SHORT_REPO_REF.test(
    line
      .replace(/`[^`]*`/g, " ")
      .replace(/\]\([^)]*\)/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[\w-]+\/[\w.-]+#\d+/g, " "),
  )

// GitHub が素の SHA を自動リンクするのは Issue・PR・コメントの中だけ。Backlog・Slack・リポジトリの docs では
// ただの文字列で、読み手はどのリポジトリのコミットかも分からない。数字だけ・英字だけの並びは数値や単語なので見ない
const HEX_TOKEN = /(?<![\w#/.-])[0-9a-f]{7,40}(?![\w-])/g
const SHA_CODE_SPAN = /`\s*([0-9a-f]{7,40})\s*`/g
const isShaLike = (token: string): boolean => /\d/.test(token) && /[a-f]/.test(token)
export const BARE_SHA_HINT = "a bare commit SHA is not linked here; write [`<sha>`](https://github.com/<owner>/<repo>/commit/<sha>)"

/** リンクになっていないコミット SHA があるか。リンク文言・URL・`<…>` の中と、SHA 以外も含むコードは見ない */
export const hasBareSha = (line: string): boolean => {
  const unlinked = line
    .replace(/\[[^\]\n]*\]\([^)\n]*\)/g, " ")
    .replace(/<[^>\n]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
  if ([...unlinked.matchAll(SHA_CODE_SPAN)].some((m) => isShaLike(m[1] ?? ""))) {
    return true
  }
  const prose = unlinked.replace(/`[^`\n]*`/g, " ")
  return [...prose.matchAll(HEX_TOKEN)].some((m) => isShaLike(m[0]))
}

/** 1行ぶんの、前後の行に依らない規則 */
const lineViolations = (line: string, masked: string, opts: LintOptions): Omit<Violation, "line">[] => {
  const text = line.trim()
  const hits: Omit<Violation, "line">[] = []
  if (hasJaEnSpace(masked)) {
    hits.push({
      rule: "ja-en-space",
      text,
      hint: "no space between fullwidth and halfwidth in Japanese prose; `#123` is the only exception",
    })
  }
  if (hasUnclosedEmphasis(maskForEmphasis(line))) {
    hits.push({
      rule: "emphasis-boundary",
      text,
      hint: "this `**` touches punctuation, a bracket, code or a link, so it stays literal; move it inside or outside (`**太字**。続き`, `「**語**」`) or put a space on the letter side",
    })
  }
  if (hasShortRepoRef(line)) {
    hits.push({
      rule: "repo-ref",
      text,
      hint: "`repo#12` is not autolinked; write https://github.com/<owner>/<repo>/issues/12",
    })
  }
  if ((opts.docs || opts.backlog) && hasBareSha(line)) {
    hits.push({ rule: "bare-sha", text, hint: BARE_SHA_HINT })
  }
  if (hasJaItalic(masked)) {
    hits.push({ rule: "ja-italic", text, hint: "no italics in Japanese; use bold or rephrase" })
  }
  return hits
}

/** docs: リポジトリに置く文書。backlog: Backlog に出す本文。どちらも GitHub の自動リンクが効かない。en: 英語の文の長さと `;` の列も見る */
export type LintOptions = { docs?: boolean; backlog?: boolean; en?: boolean }

/** 1ファイル分の行単位チェック。コードフェンス内(mermaid含む)は対象外 */
export const checkLines = (content: string, opts: LintOptions = {}): Violation[] => {
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
    for (const hit of lineViolations(line, masked, opts)) {
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

export const lint = (content: string, opts: LintOptions = {}): Violation[] => {
  const hits = checkLines(content, opts)
  if (opts.en) {
    hits.push(...checkEnglish(content))
  }
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

// 日本語の文(表ならセル)だけ詰める。英文のセルは触らない
const dropJaEnSpaceInJapanese = (line: string): string =>
  segments(line)
    .map((seg) => (isJapaneseProse(maskInline(seg)) ? withProtectedCodeSpans(seg, dropJaEnSpace) : seg))
    .join("|")

const fixLine = (line: string): string =>
  padCommonMarkEmphasisClosers(
    withProtectedCodeSpans(dropJaEnSpaceInJapanese(line).replace(CLOSING_KEYWORD_INLINE_CODE, "$1 $2"), (prose) =>
      addReferenceSpacing(prose),
    ),
  )

/**
 * 機械的に直せる分だけ直す。判断が要る違反(ja-italic・bold-density)は lint が出すだけで触らない。
 * - 日本語の文(表はセル単位)で、全角と半角の間のスペースを詰める。英文は触らない
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
