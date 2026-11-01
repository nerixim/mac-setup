// 手で折り返した段落(80〜100桁ごとに改行した地の文)を見つけ、1行につなぐ。--docs だけで使う。
// リポジトリの文書では段落の中の改行は描画で空白1つになるだけなので、つないでも表示は変わらない。
// 折り返したままだと、1語足すだけで後ろの行が全部ずれて差分が読めない(2026-11-01、オーナー)。
// 1行ごとに意味がある書き方(「— 項目;」の列、`Key: value` の列、対訳の行、短い行の並び)は折り返しではないので触らない。

/** 段落のどこかの行(最後の行を除く)がこの表示幅以上なら、桁で折り返した段落と見る。短い行の並びは意図した改行 */
export const FILL_MIN = 60

const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u
export const displayWidth = (line: string): number => [...line].reduce((sum, ch) => sum + (WIDE.test(ch) ? 2 : 1), 0)

// 次の行がこの形なら、新しいブロックか項目の始まり。Markdown の記法に加えて、Markdown にしていない箇条(— • ・ ※ ① (1) ¹)、
// 写真の出典行(pechka の `{photo …}`)、投稿の下書きのハッシュタグ行(`#韓国語勉強`)も含める
const BLOCK_START =
  /^\s*(?:[-*+]\s|\d+[.)]\s|#{1,6}(?:\s|$)|#[^\s#\d]|\||>|<|```|~~~|!\[|\[!\[|\[\^[^\]]+\]:|\[[^\]]+\]:\s|\$\$|:::|\{|[—–•・※→①-⑳¹²³⁴⁵⁶⁷⁸⁹⁰]|[（(]\d+[)）]|\*\*\d+[.)]\*\*)/u
// 区切り線、Setext 見出しの下線、引用を略した `...` だけの行
const RULE_LINE = /^\s*(?:([-*_])(?:\s*\1){2,}|=+|-+|\.{3}|…+)\s*$/
// 前の行がこの形なら、その後ろの改行は段落の中の改行ではない(画像の行、URL だけの行、1行まるごと太字の題は1行で置くもの)
const BLOCK_LINE = /^\s*(?:#{1,6}(?:\s|$)|\||<|```|~~~|\[[^\]]+\]:\s|!\[|\[!\[|https?:\/\/\S+\s*$|\*\*[^*]+\*\*\s*$)/
const HARD_BREAK = / {2}$|\\$|<br\s*\/?>\s*$/i
// `Status: …` `4級 ≈500語: …` のような見出し語つきの行。前後の行がどちらもこの形なら1行ずつの記録
const KEY_VALUE = /^\s*\*{0,2}[^\s:：][^:：]{0,23}\*{0,2}[:：](?:\s|$)/u
// `**What**:` `Why:` `How (CSS only):` `答え:` のような項目名で始まる行。文の終わりの後ろに来たら、項目ごとの行として残す
const FIELD_START =
  /^\s*(?:\*\*[^*\n]{1,24}\*\*[:：]|[A-Z\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}][^:：]{0,23}[:：])(?:\s|$)/u
const LIST_MARKER = /^\s*(?:[-*+]|\d+[.)])\s/
const FENCE = /^\s*(?:```|~~~)/

/** prev と next の間の改行が、段落の中のただの改行(描画で空白になる)か */
export const isSoftBreak = (prev: string, next: string): boolean => {
  if (prev.trim() === "" || next.trim() === "") {
    return false
  }
  if (HARD_BREAK.test(prev) || BLOCK_LINE.test(prev) || /\|\s*$/.test(prev) || RULE_LINE.test(prev)) {
    return false
  }
  if (BLOCK_START.test(next) || RULE_LINE.test(next)) {
    return false
  }
  if (SENTENCE_END.test(prev.trimEnd()) && FIELD_START.test(next)) {
    return false
  }
  return !(KEY_VALUE.test(prev) && KEY_VALUE.test(next))
}

const indentWidth = (line: string): number => (line.match(/^[ \t]*/)?.[0] ?? "").replace(/\t/g, "    ").length

/** 空行の後ろで4桁以上字下げした行は、リスト項目でなければインデントのコードブロック */
const startsIndentedCode = (line: string): boolean => indentWidth(line) >= 4 && !LIST_MARKER.test(line)

/** 0始まりの行番号で、start から end まで(両端を含む)が1つの段落 */
export type WrappedParagraph = { start: number; end: number }

// 1行1文で書いた段落(kanyomi の物語の入力は行が文の単位)と、読点で改行する日本語のメール文面は折り返しではない。
// 行末が文や句の終わりでない行が1つでもあれば折り返し
const SENTENCE_END = /[.!?。！？:;：；…‥、][)）」』"'”’»›*_`]*$/u

const isWrapped = (lines: string[], start: number, end: number): boolean => {
  const broken = lines.slice(start, end).map((line) => line.trimEnd())
  return broken.some((line) => displayWidth(line) >= FILL_MIN) && broken.some((line) => !SENTENCE_END.test(line))
}

/** 桁で折り返した段落の一覧。コードフェンス・frontmatter・インデントのコードブロックの中は見ない */
export const findWrappedParagraphs = (lines: string[]): WrappedParagraph[] => {
  const found: WrappedParagraph[] = []
  let fence = false
  let comment = false
  let frontmatter = lines[0]?.trim() === "---"
  let start = -1
  const close = (end: number): void => {
    if (start >= 0 && end > start && isWrapped(lines, start, end)) {
      found.push({ start, end })
    }
    start = -1
  }

  for (const [index, raw] of lines.entries()) {
    const line = raw.replace(/\r$/, "")
    if (frontmatter) {
      if (index > 0 && /^(?:---|\.\.\.)\s*$/.test(line)) {
        frontmatter = false
      }
      continue
    }
    if (FENCE.test(line)) {
      close(index - 1)
      fence = !fence
      continue
    }
    if (fence) {
      continue
    }
    // 複数行の HTML コメント(<!-- 編集メモ … -->)の中は文書の本文ではない
    if (comment || /<!--(?![\s\S]*-->)/.test(line)) {
      close(index - 1)
      comment = comment ? !line.includes("-->") : true
      continue
    }
    if (start >= 0 && isSoftBreak(lines[index - 1] ?? "", line)) {
      continue
    }
    close(index - 1)
    const afterBlank = index === 0 || (lines[index - 1] ?? "").trim() === ""
    start = line.trim() === "" || (afterBlank && startsIndentedCode(line)) ? -1 : index
  }
  close(lines.length - 1)
  return found
}

// 日本語と中国語の文字は語の間に空白を置かない。ハングルは分かち書きなので含めない
const JA_CHAR = /[　-〿぀-ヿ㐀-䶿一-鿿！-｠]/u
const JA_CHARS = new RegExp(JA_CHAR.source, "gu")
const LATIN_CHARS = /[A-Za-z]/g
const HALF_WORD = /[A-Za-z0-9`]/

/** 段落の行をつなぐ。日本語の文では、日本語の側でつなぐ改行を空白にしない(ja-en-space と同じ規則) */
export const joinWrappedLines = (lines: string[]): string => {
  const text = lines.join("")
  const japanese = (text.match(JA_CHARS) ?? []).length > (text.match(LATIN_CHARS) ?? []).length
  return lines.reduce((out, raw, index) => {
    if (index === 0) {
      return raw.trimEnd()
    }
    const next = raw.trim()
    const last = out.at(-1) ?? ""
    const first = next[0] ?? ""
    const bothJa = JA_CHAR.test(last) && JA_CHAR.test(first)
    const jaEn = (JA_CHAR.test(last) && HALF_WORD.test(first)) || (HALF_WORD.test(last) && JA_CHAR.test(first))
    return `${out}${bothJa || (jaEn && japanese) ? "" : " "}${next}`
  }, "")
}

/** 桁で折り返した段落をすべて1行にする。それ以外の行は1文字も変えない */
export const unwrapParagraphs = (markdown: string): string => {
  const lines = markdown.split("\n")
  const paragraphs = findWrappedParagraphs(lines)
  if (paragraphs.length === 0) {
    return markdown
  }
  const out: string[] = []
  let cursor = 0
  for (const { start, end } of paragraphs) {
    out.push(...lines.slice(cursor, start), joinWrappedLines(lines.slice(start, end + 1)))
    cursor = end + 1
  }
  out.push(...lines.slice(cursor))
  return out.join("\n")
}
