import { describe, expect, it } from "bun:test"
import { fixGithubMarkdown, lint } from "./lint.ts"
import { findWrappedParagraphs, unwrapParagraphs } from "./wrap.ts"

const wrapped = (markdown: string): number => findWrappedParagraphs(markdown.split("\n")).length
const untouched = (markdown: string): void => {
  expect(unwrapParagraphs(markdown)).toBe(markdown)
}

// 例は 2026-11-01 に meta と kanyomi の追跡中の .md から拾った
describe("unwrapParagraphs", () => {
  it("80桁前後で折り返した英語の段落を空白1つでつなぐ", () => {
    const doc = [
      "Live-mode Stripe objects for kanyomi.app: the archive product and ¥480 monthly price",
      "(lookup key `kanyomi_archive_monthly`), the webhook endpoint and the Customer Portal",
      "configuration. State is in the private R2 bucket `nerixim-tfstate`.",
      "",
      "Next paragraph.",
    ].join("\n")
    expect(unwrapParagraphs(doc)).toBe(
      [
        "Live-mode Stripe objects for kanyomi.app: the archive product and ¥480 monthly price (lookup key `kanyomi_archive_monthly`), the webhook endpoint and the Customer Portal configuration. State is in the private R2 bucket `nerixim-tfstate`.",
        "",
        "Next paragraph.",
      ].join("\n"),
    )
  })

  it("日本語の段落は日本語どうし・日本語と英数字の間を詰め、記号の前後は描画どおり空白を残す", () => {
    const doc = [
      "記録の鍵は`lemma`(`docs/data-model.md` §Word saveの名寄せと同じ)なので、`갔고`と`갔습니다`のように活用が違っても",
      "同じ語として1件で数える。",
      "",
      "置き場所は`localStorage`だけで、アカウントは要らない(製品原則6)。したがって**端末ごとに独立していて、消えることがある** —",
      "プライベートウィンドウ、サイトデータの消去、別のブラウザ。サーバ同期はサインイン後の課題",
      "`#15`で扱う。",
    ].join("\n")
    expect(unwrapParagraphs(doc)).toBe(
      [
        "記録の鍵は`lemma`(`docs/data-model.md` §Word saveの名寄せと同じ)なので、`갔고`と`갔습니다`のように活用が違っても同じ語として1件で数える。",
        "",
        "置き場所は`localStorage`だけで、アカウントは要らない(製品原則6)。したがって**端末ごとに独立していて、消えることがある** — プライベートウィンドウ、サイトデータの消去、別のブラウザ。サーバ同期はサインイン後の課題`#15`で扱う。",
      ].join("\n"),
    )
  })

  it("ハングルは分かち書きなので空白でつなぐ", () => {
    const doc = ["이 문단은 한국어로 쓴 설명인데 줄이 길어서 중간에서 손으로 줄을 바꾸어 버렸습니다 그래서", "다음 줄에 이어집니다."].join("\n")
    expect(unwrapParagraphs(doc)).toBe(
      "이 문단은 한국어로 쓴 설명인데 줄이 길어서 중간에서 손으로 줄을 바꾸어 버렸습니다 그래서 다음 줄에 이어집니다.",
    )
  })

  it("リスト項目の続きの行をつなぎ、次の項目は分けたまま", () => {
    const doc = [
      "- **Where**: `apps/web/src/components/SentenceBlock.tsx:49-52` (the `playing` branch),",
      "  with the static fallback kept for reduced motion.",
      "- Confidence: high.",
    ].join("\n")
    expect(unwrapParagraphs(doc)).toBe(
      [
        "- **Where**: `apps/web/src/components/SentenceBlock.tsx:49-52` (the `playing` branch), with the static fallback kept for reduced motion.",
        "- Confidence: high.",
      ].join("\n"),
    )
  })

  it("項目名で始まる行(**What**: / Why: / How:)は、項目の中だけつないで項目ごとの行に残す", () => {
    const doc = [
      "**What**: give the \"now playing\" sentence a treatment that can't be confused with",
      "hover/focus/pressed states — a left accent bar, not a shared",
      "`bg-accent`.",
      "**Where**: `apps/web/src/components/SentenceBlock.tsx:49-52` (the `playing && \"bg-accent\"` branch),",
      "`apps/web/src/components/AudioBar.tsx` (state source).",
      "How (CSS only): add `data-playing` to the wrapping `<div>` in `PassageReader.tsx:384-399` and style:",
    ].join("\n")
    expect(unwrapParagraphs(doc)).toBe(
      [
        "**What**: give the \"now playing\" sentence a treatment that can't be confused with hover/focus/pressed states — a left accent bar, not a shared `bg-accent`.",
        "**Where**: `apps/web/src/components/SentenceBlock.tsx:49-52` (the `playing && \"bg-accent\"` branch), `apps/web/src/components/AudioBar.tsx` (state source).",
        "How (CSS only): add `data-playing` to the wrapping `<div>` in `PassageReader.tsx:384-399` and style:",
      ].join("\n"),
    )
  })

  it("1行1文の物語の入力は触らない", () => {
    untouched(
      [
        "우리 집을 고치는 일주일 동안 어머니 집에서 지냈어요.",
        "평소에 전화도 잘 안 해서 같이 지내는 것은 삼 년 만이었어요.",
        "그릇마다 어머니가 펜으로 요일을 써 놓았어요. '월', '화', '수'…",
        "Первую неделю я говорил коту по-японски: «Кот, иди сюда!»",
        "어머니가 부엌에서 등을 보이고 말했어요. \"목요일에 또 와.\"",
      ].join("\n"),
    )
  })

  it("Markdown にしていない箇条・Key: value の列・短い行の並びは触らない", () => {
    untouched(
      [
        "Иностранец должен уметь строить письменное монологическое высказывание на тему:",
        "— письменное монологическое высказывание репродуктивно-продуктивного характера на предложенную тему;",
        "— на почте;",
      ].join("\n"),
    )
    untouched(["Status: waiting on the owner's decision about the second check runner and its cost", "Owner: nk"].join("\n"))
    untouched(["**2.** Я взял кота из приюта.", "私は保護施設から猫を引き取りました。"].join("\n"))
    untouched(["日本語タイトル: 猫と冷蔵庫", "Level: A1+"].join("\n"))
    untouched(
      [
        "4級 ≈500語: 名詞・形容詞・代名詞の格変化, 動詞の現在・過去・未来・命令形 (体の用法は含めない), 接続詞の簡単な複文",
        "3級 ≈1000語: +個数詞(主格)・順序数詞・比較級最上級・移動の動詞・который・正書法の語形変化・不規則動詞",
      ].join("\n"),
    )
    untouched(["**Full-Stack Software Engineer & AI Integration Specialist, Tokyo office**", "Tokyo, Japan | Trilingual"].join("\n"))
    untouched(["2. ( Он говори́т по-ру́сски. / Он по-ру́сски говори́т. / По-ру́сски он говори́т. )", "...", "答え: 2. Он говори́т по-ру́сски."].join("\n"))
  })

  it("読点で改行した日本語のメール文面は触らない", () => {
    untouched(
      ["先日お送りした件の補足です。", "「問い合わせ対応」「報告作業」「転記作業」のどれか1つでもあれば、", "短いメモで改善案をお返しできます。"].join("\n"),
    )
  })

  it("画像と出典の行、URL とハッシュタグの行、改行を明示した行は触らない", () => {
    untouched(
      [
        "![Режим работы Сб—Вс с 10–19（営業時間、土日の10時から19時）と書かれた黒板の看板](/contents-photos/schedule-chalkboard.jpg)",
        "{photo 1200x800 | Stolbovsky | CC BY-SA 3.0 | https://creativecommons.org/licenses/by-sa/3.0/}",
      ].join("\n"),
    )
    untouched(["https://www.kanyomi.app/blog/stories-with-audio?ref=x-stories-audio-long-tracking-tag", "#韓国語勉強 #TOPIK"].join("\n"))
    untouched(["This line ends with two spaces on purpose because the next one is an address  ", "1-2-3 Somewhere"].join("\n"))
  })

  it("コードフェンス・frontmatter・インデントのコード・HTML コメント・表は触らない", () => {
    untouched(
      [
        "---",
        "title: a frontmatter value that is long enough to look like a wrapped line of prose here",
        "level: l2",
        "---",
        "",
        "```",
        "const veryLongIdentifierName = someFunctionCall(argumentNumberOne, argumentNumberTwo, three)",
        "  .then((value) => value)",
        "```",
        "",
        "    indented code block line that is long enough to count as filled for the detector",
        "    second line of the same code block",
        "",
        "<!-- 編集メモ:",
        "- 2026-09-27のレビューで、大きい道路も狭い道路も現在は一律20メートル間隔だという指摘を受けた",
        "-->",
        "",
        "| a | b |",
        "| --- | --- |",
        "| a long table cell that is wider than sixty columns for sure, yes | b |",
      ].join("\n"),
    )
  })

  it("2回かけても結果が変わらない", () => {
    const doc = ["Researched 2026-07-12/13. All URLs below were fetched with WebFetch and confirmed", "live; quotes are copied verbatim."].join(
      "\n",
    )
    const once = unwrapParagraphs(doc)
    expect(unwrapParagraphs(once)).toBe(once)
    expect(wrapped(once)).toBe(0)
  })
})

describe("hard-wrap rule", () => {
  const doc = ["A paragraph that was wrapped by hand at about eighty columns, which is the habit", "this rule catches.", "", "最終更新日: 2026-11-01"].join(
    "\n",
  )

  it("--docs だけで段落ごとに1回出し、通常のモードでは出さない", () => {
    expect(lint(doc, { docs: true }).filter((v) => v.rule === "hard-wrap")).toEqual([
      expect.objectContaining({ line: 1, rule: "hard-wrap" }),
    ])
    expect(lint(doc).map((v) => v.rule)).not.toContain("hard-wrap")
  })

  it("--docs --fix はつなぎ、通常の --fix は改行を残す", () => {
    expect(fixGithubMarkdown(doc, { docs: true }).split("\n")[0]).toBe(
      "A paragraph that was wrapped by hand at about eighty columns, which is the habit this rule catches.",
    )
    expect(fixGithubMarkdown(doc)).toBe(doc)
  })
})
