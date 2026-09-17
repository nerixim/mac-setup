import { describe, expect, it } from "bun:test"
import { fixGithubMarkdown, hasUnclosedEmphasis, lint } from "./lint.ts"

const rules = (markdown: string, opts?: { docs?: boolean }): string[] => lint(markdown, opts).map((v) => v.rule)

describe("hasUnclosedEmphasis", () => {
  it("約物で閉じて直後に文字が続く `**` を閉じ記号と認めない", () => {
    expect(hasUnclosedEmphasis("**強調。**続き")).toBe(true)
    expect(hasUnclosedEmphasis("**bold.**text")).toBe(true)
  })
  it("句点を外に出した形と、連続した強調は誤検知しない", () => {
    expect(hasUnclosedEmphasis("**強調**。続き")).toBe(false)
    expect(hasUnclosedEmphasis("**A**と**B**")).toBe(false)
    expect(hasUnclosedEmphasis("強調は無い行")).toBe(false)
  })
})

describe("lint", () => {
  it("全角と半角の間のスペースを出す", () => {
    expect(rules("Slack 通知を追加する")).toEqual(["ja-en-space"])
    expect(rules("Slack通知を追加する")).toEqual([])
  })
  it("`#123` の前後のスペースは例外として通す", () => {
    expect(rules("関連 #123 を確認する")).toEqual([])
  })
  it("コードスパン・リンク先・URL の中は見ない", () => {
    expect(rules("`bun run check` を通す")).toEqual([])
    expect(rules("[手順](https://example.com/a b) を読む")).toEqual([])
  })
  it("コードフェンスの中は見ない", () => {
    expect(rules("```\nSlack 通知\n```\n本文")).toEqual([])
  })
  it("日本語の斜体を出し、英語の斜体とスネークケースは通す", () => {
    expect(rules("*強調したい*こと")).toEqual(["ja-italic"])
    expect(rules("これは *emphasis* です")).toEqual([])
    expect(rules("`foo_bar_baz` を渡す")).toEqual([])
  })
  it("1つの見出しの下で太字が3箇所目に入ったところで出す", () => {
    expect(rules("## 節\n\n**あ**と**い**の話")).toEqual([])
    expect(rules("## 節\n\n**あ**と**い**と**う**")).toEqual(["bold-density"])
  })
  it("箇条書きの先頭の太字と表のセルは数えない(別の型として扱う)", () => {
    expect(rules("## 節\n\n- **一つ目**の話\n- **二つ目**の話\n- **三つ目**の話")).toEqual([])
    expect(rules("## 節\n\n| **あ** | **い** | **う** |")).toEqual([])
    expect(rules("## 節\n\n- **一つ目**: **あ**と**い**と**う**の話")).toEqual(["bold-density"])
  })
  it("見出しをまたぐと太字の数を数えなおす", () => {
    expect(rules("## 一\n**あ**と**い**\n## 二\n**う**と**え**")).toEqual([])
  })
  it("--docs のときだけ末尾の最終更新日を見る", () => {
    expect(rules("本文\n")).toEqual([])
    expect(rules("本文\n", { docs: true })).toEqual(["last-updated"])
    expect(rules("本文\n\n最終更新日: 2026-09-17\n", { docs: true })).toEqual([])
  })
})

describe("fixGithubMarkdown", () => {
  it("全角と半角の間のスペースを詰める", () => {
    expect(fixGithubMarkdown("Slack 通知を追加")).toBe("Slack通知を追加")
    expect(fixGithubMarkdown("通知を Slack へ")).toBe("通知をSlackへ")
  })
  it("`#123` の前後にはスペースを入れる(無いと自動リンクされない)", () => {
    expect(fixGithubMarkdown("関連#123を確認")).toBe("関連 #123 を確認")
    expect(fixGithubMarkdown("関連 #123 を確認")).toBe("関連 #123 を確認")
  })
  it("素通しになる閉じ強調の後ろにスペースを入れる", () => {
    expect(fixGithubMarkdown("**強調。**続き")).toBe("**強調。** 続き")
    expect(fixGithubMarkdown("**強調**。続き")).toBe("**強調**。続き")
  })
  it("closing キーワードのコード囲みを外す", () => {
    expect(fixGithubMarkdown("`fixes #12` で閉じる")).toBe("fixes #12 で閉じる")
  })
  it("コードスパン・URL・コードフェンスの中は触らない", () => {
    expect(fixGithubMarkdown("`gh pr view 1` を叩く")).toBe("`gh pr view 1` を叩く")
    // URL の直後の空白は残す。詰めると GFM の自動リンクが後ろの日本語まで飲み込む
    expect(fixGithubMarkdown("https://example.com/a?q=1 を開く")).toBe("https://example.com/a?q=1 を開く")
    expect(fixGithubMarkdown("```\nSlack 通知\n```")).toBe("```\nSlack 通知\n```")
  })
})
