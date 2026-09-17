import { describe, expect, it } from "bun:test"
import { countParagraphs, lintSlack, slackBody, toSlackMrkdwn } from "./slack.ts"

const rules = (markdown: string): string[] => lintSlack(markdown).map((v) => v.rule)

describe("lintSlack", () => {
  it("Slack が描画しない記法を出す", () => {
    expect(rules("| 列 | 値 |")).toEqual(["slack-table"])
    expect(rules("## 見出し")).toEqual(["slack-heading"])
    expect(rules("**強調**の話")).toEqual(["slack-bold"])
    expect(rules("[手順](https://example.com) を読む")).toEqual(["slack-link"])
    expect(rules("~~取り消し~~")).toEqual(["slack-strike"])
  })
  it("Slack 記法の太字とリンクは通す", () => {
    expect(rules("*強調* の話")).toEqual([])
    expect(rules("<https://example.com|手順> を読む")).toEqual([])
  })
  it("`*` やコードスパンが日本語に密着していると出す", () => {
    expect(rules("これは*強調*です")).toEqual(["slack-boundary"])
    expect(rules("ジョブ（`id`）を見る")).toEqual(["slack-boundary"])
    expect(rules("ジョブ(`id`)を見る")).toEqual([])
    expect(rules("これは *強調* です")).toEqual([])
  })
  it("半角英数に挟まれた `*` や `_` は触らない(Slack も整形しないので、足すと無い強調を作る)", () => {
    expect(rules("foo_bar_baz を渡す")).toEqual([])
    expect(rules("a*b*c")).toEqual([])
  })
  it("3段落以上を出す", () => {
    expect(rules("一段落目。\n\n二段落目。")).toEqual([])
    expect(rules("一段落目。\n\n二段落目。\n\n三段落目。")).toEqual(["slack-length"])
  })
  it("`---` より下は本文として数えない", () => {
    expect(rules("一段落目。\n\n二段落目。\n\n---\n\n三段落目。\n\n四段落目。")).toEqual([])
  })
})

describe("slackBody / countParagraphs", () => {
  it("最初の `---` で切る", () => {
    expect(slackBody("本文\n\n---\n\n詳細")).toBe("本文\n")
    expect(slackBody("本文だけ")).toBe("本文だけ")
  })
  it("コードフェンスの中の空行で段落を割らない", () => {
    expect(countParagraphs("```\na\n\nb\n```")).toBe(1)
  })
})

describe("toSlackMrkdwn", () => {
  it("太字・斜体・取り消し線を Slack 記法にする", () => {
    expect(toSlackMrkdwn("**強調** の話")).toBe("*強調* の話")
    expect(toSlackMrkdwn("これは *italic* です")).toBe("これは _italic_ です")
    expect(toSlackMrkdwn("~~取り消し~~ 済み")).toBe("~取り消し~ 済み")
  })
  it("見出しを太字の行に、箇条書きを中黒にする", () => {
    expect(toSlackMrkdwn("## 進捗")).toBe("*進捗*")
    expect(toSlackMrkdwn("- 一つ目\n- 二つ目")).toBe("• 一つ目\n• 二つ目")
  })
  it("リンクを `<URL|文言>` にする", () => {
    expect(toSlackMrkdwn("[手順](https://example.com/a) を読む")).toBe("<https://example.com/a|手順> を読む")
  })
  it("日本語に密着した `*` とコードスパンにスペースを入れる", () => {
    expect(toSlackMrkdwn("これは**強調**です")).toBe("これは *強調* です")
    expect(toSlackMrkdwn("ジョブ（`id`）を見る")).toBe("ジョブ（ `id` ）を見る")
    expect(toSlackMrkdwn("件は*こちら*で確認")).toBe("件は _こちら_ で確認")
  })
  it("半角英数に挟まれた `_` は触らない", () => {
    expect(toSlackMrkdwn("foo_bar_baz を渡す")).toBe("foo_bar_baz を渡す")
  })
  it("コードフェンスの中は変換しない", () => {
    expect(toSlackMrkdwn("```\n- 一つ目\n**bold**\n```")).toBe("```\n- 一つ目\n**bold**\n```")
  })
  it("表は畳めないので残す(lintSlack が出す)", () => {
    expect(toSlackMrkdwn("| 列 | 値 |")).toBe("| 列 | 値 |")
  })
})
