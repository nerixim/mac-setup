import { describe, expect, it } from "bun:test"
import { fixGithubMarkdown, hasUnclosedEmphasis, type LintOptions, lint } from "./lint.ts"

const rules = (markdown: string, opts?: LintOptions): string[] => lint(markdown, opts).map((v) => v.rule)

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
  it("英文が日本語の語を引くときの空白は通し、日本語の文は識別子が長くても出す", () => {
    expect(rules("a content-drawn mark for 文法 and a 漢 pair for 単語")).toEqual([])
    expect(rules("shows 「その言葉は使えません」 as a status text")).toEqual([])
    expect(rules("Why is 이/가 taught as a case in Russian and as てにをは in Japanese?")).toEqual([])
    expect(rules("Article pages: HANA press スタッフブログ, note.com 学習ジャーナル")).toEqual([])
    expect(rules("露検 first, ТРКИ only when an international certificate is needed")).toEqual([])
    expect(rules("GitHub Actions の spending limit を上げる")).toEqual(["ja-en-space"])
    expect(rules("Cloudflare Workers の設定を見る")).toEqual(["ja-en-space"])
    expect(rules("Next.js App Router の設定を見る")).toEqual(["ja-en-space"])
    expect(rules("通知を Slack へ")).toEqual(["ja-en-space"])
    expect(rules("TOPIK 過去問")).toEqual(["ja-en-space"])
  })
  it("表はセルごとに文の言語を見る", () => {
    expect(rules("| Slack 通知 | closed by default with a 文法 39 label |")).toEqual(["ja-en-space"])
    expect(rules("| open | closed by default with a 文法 39 label |")).toEqual([])
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
    expect(fixGithubMarkdown("120,469 lifetime 伊検 applicants over 58 sessions")).toBe("120,469 lifetime 伊検 applicants over 58 sessions")
    expect(fixGithubMarkdown("| Slack 通知 | a mark for 文法 39 |")).toBe("| Slack通知 | a mark for 文法 39 |")
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

describe("repo-ref", () => {
  it("オーナーを欠いた `repo#12` を出す", () => {
    expect(rules("Dictation (kanyomi#160) is first.")).toContain("repo-ref")
  })
  it("`#12`・`owner/repo#12`・URL・コード内は通す", () => {
    expect(rules("see #12 and nerixim/kanyomi#160")).not.toContain("repo-ref")
    expect(rules("https://example.com/page#123 and `tasks.mjs done kanyomi#61`")).not.toContain("repo-ref")
  })
})

describe("bare-sha", () => {
  const backlog = { backlog: true }
  it("Backlog と docs では、リンクにしていない SHA を出す", () => {
    expect(rules("48670cfb で直した", backlog)).toContain("bare-sha")
    expect(rules("`48670cfb` で直した", backlog)).toContain("bare-sha")
    expect(rules("nerixim/meta@48670cfb を見る", backlog)).toContain("bare-sha")
    expect(rules("48670cfb で直した\n\n最終更新日: 2026-10-01", { docs: true })).toContain("bare-sha")
  })
  it("GitHub 宛(既定)では出さない。同じリポジトリの SHA は自動リンクされる", () => {
    expect(rules("48670cfb で直した")).not.toContain("bare-sha")
  })
  it("リンク・URL・SHA 以外も含むコード・コードフェンスは通す", () => {
    expect(rules("[`48670cfb`](https://github.com/o/r/commit/48670cfb) で直した", backlog)).not.toContain("bare-sha")
    expect(rules("https://github.com/o/r/commit/48670cfb1234", backlog)).not.toContain("bare-sha")
    expect(rules("`git show 48670cfb` を流す", backlog)).not.toContain("bare-sha")
    expect(rules("```\ngit show 48670cfb\n```", backlog)).not.toContain("bare-sha")
  })
  it("数値・単語・UUID・色・版番号は SHA と見なさない", () => {
    expect(rules("ID は `1074014292`、件数は 1234567", backlog)).not.toContain("bare-sha")
    expect(rules("decade と defaced と facade", backlog)).not.toContain("bare-sha")
    expect(rules("id 0f8e1a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b", backlog)).not.toContain("bare-sha")
    expect(rules("色は #a1b2c3d4、版は v1.2.3abcdef0", backlog)).not.toContain("bare-sha")
  })
})
