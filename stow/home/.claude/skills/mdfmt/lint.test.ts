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
  // 4行とも GitHub の Markdown API が `**` をそのまま返した(2026-10-05)
  it("内側がかっこ・コード・リンクで外側が文字の `**` を、開き・閉じと認めない", () => {
    expect(hasUnclosedEmphasis("これは**「正しい使い方」**です。")).toBe(true)
    expect(hasUnclosedEmphasis("**「行頭」**です。")).toBe(true)
    expect(rules("設定は**`foo`**に置く。")).toEqual(["emphasis-boundary"])
    expect(rules("詳細は**[手順書](https://example.com)**にある。")).toEqual(["emphasis-boundary"])
  })
  it("かっこを外に出した形・スペースで切った形・`***` は誤検知しない", () => {
    expect(hasUnclosedEmphasis("「**正しい使い方**」です。")).toBe(false)
    expect(hasUnclosedEmphasis("これは **「正しい使い方」** です。")).toBe(false)
    expect(hasUnclosedEmphasis("これは***強調***です")).toBe(false)
    expect(rules("**`foo`** に置く。")).toEqual([])
    expect(rules("| **「あ」** | **`b`** |")).toEqual([])
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
  it("日本語に密着した半角かっこを出し、全角か外側に空白があれば通す。英文は見ない", () => {
    expect(rules("ジョブ(id)を見る")).toEqual(["ja-paren"])
    expect(rules("確認した(2件)。")).toEqual(["ja-paren"])
    expect(rules("ジョブ (id) を見る")).toEqual([])
    expect(rules("ジョブ（id）を見る")).toEqual([])
    expect(rules("see (id) here")).toEqual([])
    expect(rules("手順は [こちら](https://x/y(z)) を読む")).toEqual([])
  })
  it("`#123` の前後のスペースは例外として通す", () => {
    expect(rules("関連 #123 を確認する")).toEqual([])
  })
  it("素のコミット SHA の前後のスペースも例外として通す(密着すると自動リンクされない)", () => {
    expect(rules("関連 fe1ee990a7 を確認する")).toEqual([])
    expect(rules("値 1234567 を見る")).toEqual(["ja-en-space"])
  })
  it("直前が日本語・全角約物・引用符の素の SHA は自動リンクされないので出す。行頭・空白・`(` `[` `*` `_` の後は通す", () => {
    expect(rules("イメージは、b9562e5（2025-03-13）から")).toEqual(["sha-spacing"])
    expect(rules("「b9562e5」の修正")).toEqual(["sha-spacing"])
    expect(rules("版は\"b9562e5\"です")).toEqual(["sha-spacing"])
    expect(rules("b9562e5の修正")).toEqual([])
    expect(rules("イメージは (b9562e5) から")).toEqual([])
    expect(rules("**b9562e5** の修正")).toEqual([])
    expect(rules("[b9562e5](https://x/commit/b9562e5) と `b9562e5` は見ない")).toEqual([])
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
    expect(rules("Body\n\nLast updated: 2026-10-13\n", { docs: true })).toEqual([])
    expect(rules("Body\n\nLast updated: October 2026\n", { docs: true })).toEqual(["last-updated"])
  })
})

describe("fixGithubMarkdown", () => {
  it("全角と半角の間のスペースを詰める", () => {
    expect(fixGithubMarkdown("Slack 通知を追加")).toBe("Slack通知を追加")
    expect(fixGithubMarkdown("通知を Slack へ")).toBe("通知をSlackへ")
    expect(fixGithubMarkdown("120,469 lifetime 伊検 applicants over 58 sessions")).toBe("120,469 lifetime 伊検 applicants over 58 sessions")
    expect(fixGithubMarkdown("| Slack 通知 | a mark for 文法 39 |")).toBe("| Slack通知 | a mark for 文法 39 |")
  })
  it("日本語に密着した半角かっこの対を全角にする。コード・リンク先の中と英文は触らない", () => {
    expect(fixGithubMarkdown("ジョブ(id)を見る")).toBe("ジョブ（id）を見る")
    expect(fixGithubMarkdown("値(`x`)を見る")).toBe("値（`x`）を見る")
    expect(fixGithubMarkdown("手順([リンク](https://x/y))を読む")).toBe("手順（[リンク](https://x/y)）を読む")
    expect(fixGithubMarkdown("あ(い(c)d)え")).toBe("あ（い（c）d）え")
    expect(fixGithubMarkdown("ジョブ (id) を見る")).toBe("ジョブ (id) を見る")
    expect(fixGithubMarkdown("see (id) here")).toBe("see (id) here")
    expect(fixGithubMarkdown("`f(x)`を呼ぶ")).toBe("`f(x)`を呼ぶ")
  })
  it("`#123` の前後にはスペースを入れる(無いと自動リンクされない)", () => {
    expect(fixGithubMarkdown("関連#123を確認")).toBe("関連 #123 を確認")
    expect(fixGithubMarkdown("関連 #123 を確認")).toBe("関連 #123 を確認")
  })
  it("素のコミット SHA は直前だけスペースを入れ(直後は自動リンクに効かない)、リンク文言の中とコードの中は触らない", () => {
    expect(fixGithubMarkdown("イメージは、b9562e5（2025-03-13）から")).toBe("イメージは、 b9562e5（2025-03-13）から")
    expect(fixGithubMarkdown("fe1ee990a7の修正")).toBe("fe1ee990a7の修正")
    expect(fixGithubMarkdown("関連 fe1ee990a7 を確認")).toBe("関連 fe1ee990a7 を確認")
    expect(fixGithubMarkdown("[fe1ee990a7](https://x/commit/fe1ee990a7) の修正")).toBe("[fe1ee990a7](https://x/commit/fe1ee990a7) の修正")
    expect(fixGithubMarkdown("`fe1ee990a7` の修正")).toBe("`fe1ee990a7` の修正")
    expect(fixGithubMarkdown("値 1234567 を見る")).toBe("値1234567を見る")
  })
  it("素通しになる閉じ強調の後ろにスペースを入れる", () => {
    expect(fixGithubMarkdown("**強調。**続き")).toBe("**強調。** 続き")
    expect(fixGithubMarkdown("**強調**。続き")).toBe("**強調**。続き")
  })
  it("素通しになる開き強調の前にもスペースを入れ、直した結果は lint を通る", () => {
    expect(fixGithubMarkdown("これは**「語」**です。")).toBe("これは **「語」** です。")
    expect(fixGithubMarkdown("設定は**`foo`**に置く。")).toBe("設定は **`foo`** に置く。")
    expect(fixGithubMarkdown("「**語**」です。")).toBe("「**語**」です。")
    expect(rules(fixGithubMarkdown("これは**「語」**です。"))).toEqual([])
    expect(rules(fixGithubMarkdown("設定は**`foo`**に置く。"))).toEqual([])
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

describe("file-link", () => {
  it("リンクにしていないリポジトリ相対のファイルパスを出す", () => {
    expect(rules("Layout is in `1-language-apps/textbook-formats-2026-09-11.md`.")).toContain("file-link")
    expect(rules("See textbook-formats-2026-09-11.md §4.1.")).toContain("file-link")
    expect(rules("| `scripts/library.mjs` | reads loans |")).toContain("file-link")
    expect(rules("the parser in scripts/edogawa-opac/parse.ts")).toContain("file-link")
    expect(rules("`inputs/korean-books/README.md` has one row per book")).toContain("file-link")
  })
  it("リンク・URL・絶対パス・コマンドの中のパス・ディレクトリは通す", () => {
    expect(
      rules("[textbook-formats](https://github.com/nerixim/meta/blob/main/1-language-apps/textbook-formats-2026-09-11.md)"),
    ).toEqual([])
    expect(rules("[`scripts/library.mjs`](https://github.com/nerixim/meta/blob/main/scripts/library.mjs)")).toEqual([])
    expect(rules("https://github.com/nerixim/meta/blob/main/scripts/library.mjs")).toEqual([])
    expect(rules("`/Users/nk/ghq/github.com/nerixim/meta/inputs/korean-books/README.md`")).toEqual([])
    expect(rules("`~/.claude/skills/mdfmt/lint.ts`")).toEqual([])
    expect(rules("run `bun scripts/library.mjs loans` first")).toEqual([])
    expect(rules("pages land in `inputs/korean-books/pages/<book>/`")).toEqual([])
    expect(rules("`*.test.ts` sits next to the code")).toEqual([])
  })
  it("ファイル名でない語(Next.js、版番号、ドメイン、分数)は通す", () => {
    expect(rules("Next.js 16.4.2 and Node.js on kanyomi.app/drill")).toEqual([])
    expect(rules("1/2.5 of the pages")).toEqual([])
  })
  it("Backlog と docs では見ない", () => {
    expect(rules("`scripts/library.mjs`", { backlog: true })).not.toContain("file-link")
    expect(rules("`scripts/library.mjs`\n\n最終更新日: 2026-10-26", { docs: true })).not.toContain("file-link")
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

describe("--en", () => {
  const en = { en: true }
  const long =
    "With the cat cover as the single allowed reference, the cat prompt came back as a near-copy of that cover in clean vector, and the hero prompt came back as the same porch with a woman on it."
  it("30語を超える英語の文を出し、既定では見ない", () => {
    expect(rules(long, en)).toEqual(["en-long-sentence"])
    expect(rules(long)).toEqual([])
    expect(rules("The cat prompt came back as a near-copy of that cover. The hero prompt came back as the same porch.", en)).toEqual([])
  })
  it("折り返した段落は1つの文として数え、始まりの行で出す", () => {
    const wrapped = long.replace(", and the hero", ",\nand the hero")
    expect(lint(`intro\n\n${wrapped}`, en).map((v) => [v.line, v.rule])).toEqual([[3, "en-long-sentence"]])
  })
  it("1段に `;` が2つ以上ある列を出し、1つは通す", () => {
    expect(rules("- Google: models page ; pricing page ; terms page with the ownership clause", en)).toEqual(["en-semicolon-chain"])
    expect(rules("| source | Utena case; JAL and Fugetsudo case; backlash roundup |", en)).toEqual(["en-semicolon-chain"])
    expect(rules("The first run failed on billing; the second run passed after the limit was raised.", en)).toEqual([])
  })
  it("コード・URL・リンク先・フェンスの中の `;` と語は数えない", () => {
    expect(rules("Run `a; b; c` from the repository root and read the last line.", en)).toEqual([])
    expect(rules("See https://example.com/a;b;c for the three variants that the vendor lists.", en)).toEqual([])
    expect(rules("```\nfor (;;) { run(); stop(); }\n```", en)).toEqual([])
  })
  it("日本語の文は見ない", () => {
    expect(rules("確認した; 直した; 出した; これは日本語の文なので英語の規則では見ない。", en)).toEqual([])
  })
})
