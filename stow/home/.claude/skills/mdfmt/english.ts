// 英語の文の詰め込みを出す(`--en`)。語の選び方は見ない。
// meta の英語 docs 3本を数えた結果(2026-10-05)、定型句や短縮形はほぼ 0 で、多かったのは長い文と `;` でつないだ列だった。
import type { Violation } from "./lint.ts"

export const EN_SENTENCE_MAX = 30
export const EN_SEMICOLON_MAX = 1

type Block = { line: number; text: string }

const FENCE = /^\s*(```|~~~)/
const HEADING = /^#{1,6}\s/
const TABLE_ROW = /^\s*\|/
const TABLE_RULE = /^\s*\|?[\s:|-]+\|?\s*$/
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/
const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯]/g
const LATIN_WORD = /[A-Za-z][A-Za-z'-]*/g

/** コード・リンク先・URL・HTML実体は1語に畳む。中の `;` や語数を数えない */
const collapse = (text: string): string =>
  text
    .replace(/`[^`]*`/g, "CODE")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/https?:\/\/\S+/g, "URL")
    .replace(/&[#\w]+;/g, " ")

/** 段落(折り返した行はつなぐ)・箇条書きの項目・表のセルを、始まりの行番号つきで返す */
export const blocks = (content: string): Block[] => {
  const out: Block[] = []
  let current: Block | undefined
  let inFence = false
  const flush = (): void => {
    if (current !== undefined) {
      out.push(current)
      current = undefined
    }
  }

  for (const [index, raw] of content.split("\n").entries()) {
    const line = raw.replace(/\r$/, "")
    if (FENCE.test(line)) {
      flush()
      inFence = !inFence
      continue
    }
    if (inFence) {
      continue
    }
    if (line.trim() === "" || HEADING.test(line)) {
      flush()
      continue
    }
    if (TABLE_ROW.test(line)) {
      flush()
      if (!TABLE_RULE.test(line)) {
        for (const cell of line.split("|")) {
          out.push({ line: index + 1, text: cell })
        }
      }
      continue
    }
    if (LIST_ITEM.test(line)) {
      flush()
      current = { line: index + 1, text: line.replace(LIST_ITEM, "") }
      continue
    }
    if (current === undefined) {
      current = { line: index + 1, text: line.trim() }
    } else {
      current.text += ` ${line.trim()}`
    }
  }
  flush()
  return out
}

/** 英語の文か。英単語が5つ以上あり、日本語・韓国語の文字より多い */
export const isEnglish = (text: string): boolean => {
  const latin = (text.match(LATIN_WORD) ?? []).length
  return latin >= 5 && latin > (text.match(CJK) ?? []).length
}

/** 文末の `.!?` と空白、次が大文字・数字・引用符のところで切る。略語で切りすぎても語数が減るだけ */
export const sentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?]["')\]*]*)\s+(?=["'([*]*[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

export const wordCount = (sentence: string): number => sentence.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length

const snippet = (text: string): string => (text.length > 100 ? `${text.slice(0, 100)}…` : text)

export const checkEnglish = (content: string): Violation[] => {
  const hits: Violation[] = []
  for (const block of blocks(content)) {
    const text = collapse(block.text).trim()
    if (!isEnglish(text)) {
      continue
    }
    const semicolons = (text.match(/;/g) ?? []).length
    if (semicolons > EN_SEMICOLON_MAX) {
      hits.push({
        line: block.line,
        rule: "en-semicolon-chain",
        text: snippet(block.text.trim()),
        hint: `${semicolons} semicolons chain ${semicolons + 1} items in one block; one item per line, or separate sentences`,
      })
    }
    for (const sentence of sentences(text)) {
      const words = wordCount(sentence)
      if (words > EN_SENTENCE_MAX) {
        hits.push({
          line: block.line,
          rule: "en-long-sentence",
          text: snippet(sentence),
          hint: `${words} words in one sentence (limit ${EN_SENTENCE_MAX}, aim for 25); one claim per sentence`,
        })
      }
    }
  }
  return hits
}
