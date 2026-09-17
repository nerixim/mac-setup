// CommonMark/GFM と Slack mrkdwn の強調が、約物+直後の文字で素通しになるのを防ぐ。
//
// GitHub (cmark-gfm, 2026-08-14 に API で確認):
// - `これは**太字**です` はスペースなしで太字になる(CJK隣接そのものは問題ない)
// - `**太字。**続` / `**bold.**text` は閉じ区切りが right-flanking にならず `**` が残る
//   (内容末尾が約物かつ直後が空白でも約物でもない文字)
//
// Slack mrkdwn:
// - 閉じ `*` の直後は空白・行末・半角記号だけが境界。CJK や全角約物が続くと `*` が残る

const ASCII_PUNCTUATION = new Set([..."!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"])

const isCommonMarkWhitespace = (char: string): boolean => /^\s$/u.test(char)

/** CommonMark の punctuation(ASCII記号 + Unicode P*)。`+` や `=` は `\p{P}` ではないが約物扱い。 */
const isCommonMarkPunctuation = (char: string): boolean => ASCII_PUNCTUATION.has(char) || /^\p{P}$/u.test(char)

const EMPHASIS_MARKERS = ["***", "**", "*"] as const

const PROTECTED_SEGMENT_PATTERN = /(`+)[\s\S]*?\1|https?:\/\/\S+/g

const protectedToken = (index: number): string => `@@CODESPAN${index}@@`

/** コードスパンとURL内の `*` を強調と誤認せず、強調内のコードで開閉が分断されないよう退避する。 */
export const withProtectedCodeSpans = (text: string, transform: (prose: string) => string): string => {
  const spans: string[] = []
  const protectedText = text.replace(PROTECTED_SEGMENT_PATTERN, (span) => {
    const index = spans.length
    spans.push(span)
    return protectedToken(index)
  })
  const transformed = transform(protectedText)
  return transformed.replace(/@@CODESPAN(\d+)@@/g, (_match, index: string) => spans[Number(index)] ?? "")
}

const padCommonMarkCloser = (text: string, marker: string): string => {
  const escaped = "\\*".repeat(marker.length)
  const pattern = new RegExp(`(?<!\\*)${escaped}(?!\\*)([\\s\\S]*?)(?<!\\*)${escaped}(?!\\*)`, "g")

  return text.replace(pattern, (match, content: string, offset: number, source: string) => {
    if (content.length === 0) {
      return match
    }
    const last = content.at(-1)
    const after = source.at(offset + match.length)
    if (
      last === undefined ||
      after === undefined ||
      !isCommonMarkPunctuation(last) ||
      isCommonMarkWhitespace(after) ||
      isCommonMarkPunctuation(after)
    ) {
      return match
    }
    return `${marker}${content}${marker} `
  })
}

/** 閉じ `*`/`**`/`***` が約物終わり+非約物続きで素通しになるとき、閉じの後に半角スペースを入れる。 */
export const padCommonMarkEmphasisClosers = (text: string): string =>
  withProtectedCodeSpans(text, (prose) => {
    let result = prose
    for (const marker of EMPHASIS_MARKERS) {
      result = padCommonMarkCloser(result, marker)
    }
    return result
  })

/** Slack mrkdwn が開き/閉じの `*` と `` ` `` を境界と認める文字。 */
export const SLACK_BOUNDARY = /[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

// 境界でない文字のうち、スペースを足すのは非ASCII(CJK・全角約物・絵文字)に密着したときだけ。
// 半角英数に密着した `a*b*c` や `foo_bar_baz` は Slack も整形しないので、足すと無かった強調を作ってしまう。
export const isSlackTight = (char: string | undefined): boolean =>
  char !== undefined && !SLACK_BOUNDARY.test(char) && (char.codePointAt(0) ?? 0) > 0x7f

/** Slack の強調は `*太字*` `_斜体_` `~取り消し~`。いずれも開き/閉じの外側が境界でないと素通しする。 */
export const SLACK_EMPHASIS_MARKERS = ["*", "_", "~"] as const

/** Slack の `*x*` / `_x_` / `~x~` 1組にあたる。二重の `**` は開きにも閉じにもしない */
export const slackPairPattern = (marker: string): RegExp => {
  const escaped = `\\${marker}`
  return new RegExp(
    `(?<!${escaped})${escaped}(?!${escaped})([^${escaped}\n]+?)(?<!${escaped})${escaped}(?!${escaped})`,
    "g",
  )
}

const padSlackPair = (text: string, marker: string): string =>
  text.replace(slackPairPattern(marker), (match, _content: string, offset: number, source: string) => {
    const before = offset === 0 ? undefined : source.at(offset - 1)
    const after = source.at(offset + match.length)
    const padBefore = isSlackTight(before)
    const padAfter = isSlackTight(after)
    if (!(padBefore || padAfter)) {
      return match
    }
    return `${padBefore ? " " : ""}${match}${padAfter ? " " : ""}`
  })

/** Slack mrkdwn の開き/閉じが絵文字・CJK・全角約物に密着して素通しになるときスペースを入れる。 */
export const padSlackEmphasis = (text: string): string =>
  withProtectedCodeSpans(text, (prose) =>
    SLACK_EMPHASIS_MARKERS.reduce((acc, marker) => padSlackPair(acc, marker), prose),
  )

/** ```フェンス``` の外側だけに変換をかける。フェンス内はそのまま返す。 */
export const mapOutsideFences = (text: string, transform: (segment: string) => string): string =>
  text
    .split(/(```[\s\S]*?```)/g)
    .map((part, index) => (index % 2 === 1 ? part : transform(part)))
    .join("")

const CODE_SPAN_PATTERN = /(?<!`)`([^`\n]+)`(?!`)/g

// Slack mrkdwn のコードスパンは `*` と同じ境界規則に従う。全角括弧やCJKに密着すると
// 整形されず、バッククォートがそのまま表示される(例: ジョブ(`id`)内で ―― のような文)。
export const padSlackCodeSpans = (text: string): string =>
  mapOutsideFences(text, (prose) =>
    prose.replace(CODE_SPAN_PATTERN, (match, _content: string, offset: number, source: string) => {
      const before = offset === 0 ? undefined : source.at(offset - 1)
      const after = source.at(offset + match.length)
      const padBefore = isSlackTight(before)
      const padAfter = isSlackTight(after)
      if (!(padBefore || padAfter)) {
        return match
      }
      return `${padBefore ? " " : ""}${match}${padAfter ? " " : ""}`
    }),
  )
