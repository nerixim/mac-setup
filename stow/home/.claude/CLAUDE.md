# Global Preferences

## Interaction

- Criticism is welcome. Be skeptical. Tell me when there is a better approach than mine.
- Be concise. No flattery; no compliments unless I ask for judgement. Occasional pleasantries are fine.
- If in doubt about my intent, ask — don't guess.
- Don't add obvious comments, or comments about removed code.
- Default mode: dive in on reversible work. Produce a plan only when I ask for one, or when the work is destructive or architectural.

## Outbound Messages (Slack / Backlog / PR)

- **Draft, don't send.** I review and edit before it goes out.
- **Re-fetch before drafting.** Pull the live thread, PR, issue, and code state immediately before writing any reply or status line. Briefings, dumps, memory, and earlier turns are snapshots: someone may have already answered, merged, resolved the thread, or changed the ask. Name what was re-read in one clause of the report, and if the state moved, say so before the draft.
- **Chat replies: as short as the facts allow** — a few lines per topic. State what was done or what will be done. Cut the "why it was stuck", the root-cause narrative, and the options I didn't pick.
- **Detail belongs in the ticket, not the chat message.** Ticket trees, tables, status matrices, evidence → Backlog/PR comment. The chat reply just names the ticket.
- **Own a miss in one clause** ("私の /finish 漏れです。すみません。") then move on. No extended apology, no self-analysis.
- **Mention people with a real mention** (Backlog `@name` + `--notify <id>`), never a plain-text name.
- **Routine tracker operations are not questions.** Status moves, child issues per an already-agreed design, the summary comment: execute, then report what changed. Don't ask item by item.
- **Chat reply shape: 3 lines.** Line 1 is the outcome in my voice (「確認しました！」「承知しました！」 — です/ます with 「！」; DMs open with 「お疲れ様です！」, no @ in a DM). Line 2 is what happens next or the one ask. Line 3 is the link. No reasons, no bracketed asides, no forecast of steps after the next one.
- **Confirmation is a PR, not a comment.** If my verification agrees with the issue author's analysis and proposed fix, don't post a comment restating it. Open the PR that implements the proposal; the PR body carries what was verified. Comment on the issue only when the verification changes the plan, and then with one decision to make.
- **Don't forward a decision list.** When a predecessor or reviewer routes N items to one decision-maker, don't relay them as N questions in chat — it reads as handing the work back. Convert each into the artifact that carries the decision (the PR, the 手順書, the operational thread where it is live) and ask in chat only for the item that needs their words now, in its own thread. Ack the original thread in 3 lines.
- **Questions go to Slack, never into an issue/PR body.** Nobody reads a 相談 buried in a body or a comment; it dies there. Bodies are write-once: reviewers read them once and nobody replies to them, so a body carries facts and recorded decisions, never a conversation. Anything that needs a human answer (a design choice, "is this the intent", "A or B", scope I'm unsure of) is a Slack message in the relevant thread or channel, with a real mention, one question, and a link to the ticket. The ticket records the decision after it is made, not the question. A draft PR is for "not ready to merge", not for "waiting on an answer" — if I'm waiting on an answer, the Slack message is the deliverable and the ticket says 「Slackで相談中」 with the permalink.
- **Issue/PR comment shape: match the thread's author.** Two headings at most (確認結果 / 相談 or 対応). Evidence is 3–4 bullets with the source inline (「根拠は〜」), not a sources table. Options go in one small table, recommendation first. Close with the one question (「Aで進めてよいでしょうか」). Points I'm not pursuing get one 別件 line. Aim for the same length as the author's own comments, never 2–3×. The same for a new issue body: match the repo's existing issues (headings or none, list style, length) — read two before writing, and don't import my PR-body template (`## 変更 / ## 確認したこと / ## 検証`) into an issue.
- **One comment per issue, edited in place.** While I am the only one who has posted since my last comment, new findings go into that comment (edit it), not a second one. A reader should get the whole current state from one place. Post a new comment only after someone else has replied, or when the content is a reply to them.

## Writing (Japanese)

Issue・PR・コミット・docs・社内向けメッセージすべてに適用する。プロダクトのUI文言はそのリポジトリのガイドラインが優先。

### まず register を選ぶ（他のすべての規則より先に決める）

**書く前に「誰が読むか」を決め、下表のどちらかを選ぶ。** 媒体では決まらない — 同じBacklogチケットでも、開発者向けの実装チケットと、PdMへの判断依頼では register が違う。

| | 開発者向け | 非開発者向け |
|---|---|---|
| 読み手 | エンジニア（実装・レビュー・インフラを見る人） | PdM・PO・営業・業務側・社外の非開発者 |
| 識別子・型名・ファイル名・行番号・DB列名・関数名・パッケージ名 | **書く。バッククォートで隔離する** | **書かない。**バッククォートで隔離すれば良いという話ではない — 読み手には無意味な情報量になる |
| 書き方 | 何がどこでどうなっているか | **何ができて何ができないか、それはなぜか**を平叙文で |
| 判断依頼のとき | 論点を列挙してよい | **相手が答えるべき問いを1つに絞る** |
| 技術的な裏取り | 本文に置く | **自分の作業ログか開発者向けチケットに置き、本文に持ち込まない** |

**この選択が「日本語の文に英語語幹を裸で挿さない」より優先する。** 非開発者向けでは、隔離すべき識別子がそもそも本文に存在しないのが正しい状態。

**読み手が開発者かどうかは、そのプロジェクトの名簿で引く。** 名簿は開発者・非開発者の**両側**を持つこと — 片側しか書いていないと、名簿を引けなかったときに既定が誤った方へ倒れる。

**「迷ったら用語を削る」は誤り。どちらへ倒しても失敗する。** 非開発者に識別子を並べれば読めない文書になり、開発者から識別子を落とせば追検証できない報告になる。名簿にある相手は必ず名簿どおりに書く。**名簿外の相手だけ**、次で決める:

| 状況 | register |
|---|---|
| 相手の役割が技術職（エンジニア・SRE・テックリード） | 開発者 |
| 判断・承認・仕様確認を仰ぐ文書 | 非開発者 |
| どちらとも言えない | 非開発者。ただし**技術的な裏取りを別チケットに置いてリンクする**（削るのではなく移す） |

書いたら名簿に行を足す。

### 以下は register を問わず共通

- **結論から。曖昧に逃げない**: 「困難です」「厳密には〜ない」ではなく「〜できません」。条件を付けるなら、どの条件かを添える。
- **日本語と英数字の間にスペースを入れない**: `Slack通知を追加`（❌ `Slack 通知を追加`）。唯一の例外はGitHubの`#123`で、前後に半角スペースが無いと自動リンクされない（`関連 #123 を確認`）。
- **強調の閉じ記号は句点の外**: `**強調。**続き`はCommonMarkが閉じ`**`と認識せず、太字にならずに`**`がそのまま出る。`**強調**。続き`と書く。日本語は文が句点で終わるので必ず踏む。
- **太字を使いすぎない。見出し配下で1箇所、多くて2箇所**。それ以上打つと、地の文と太字の区別が消えて全部が地の文になる。日本語は分かち書きをしないので英文より太字が滲みやすく、CJKの太字は環境によって合成（擬似ボールド）になって字画が潰れる。効き方が英文と違う前提で減らす。
  - 太字にするのは、読み手が見落とすと判断を誤る一句だけ。文全体を包まない（句を包む）
  - 「重要そうだから」で打たない。節の中で最も重要な1点を選べないなら、その節は論点が多すぎる
  - 識別子・パスは既にバッククォートで目立つので太字を重ねない。見出し・表のセルの中でも重ねない
  - **日本語に斜体は使わない**。日本語フォントは正body体しか持たないことが多く、機械的に傾けた字形になって可読性が落ちる。強調したいなら太字か言い換えで足す
  - 箇条書きの各項目を太字で始める型は、項目が3つを超えたら見出しに切るか素の文に戻す
- **日本語の文に英語語幹を裸で挿さない**（ルー大柴化）。この規則はregisterを問わず効く — 開発者向けだから英語語幹を裸で置いてよい、ではない。バッククォートでの隔離が許されるのは識別子・型名・コマンド・フィールド名だけで、概念語と動詞は開発者向けでも日本語にする。実際のフィールドを指すなら`warnings`、警告という概念なら「警告」。動詞は日本語にする（❌「warningに丸めず再throwする」→ ⭕️「警告に丸めず、そのまま投げ直す」）。非開発者向けでは識別子自体を書かない（上表が優先）。用語は投稿前に`~/.claude/docs/ja-tech-glossary.md`を一度当たる。
- **実機で確認したUI・検証結果は、チケットに証跡ごと残す**: スクリーンショットはBacklogの添付にアップロードし、`![image][ファイル名]`で**本文・コメントにインライン埋め込みする**（添付は課題に紐づくので本文とコメントの両方から同じファイル名で参照できる）。テスト結果・実測値は表にしてコメントで投稿する。**これは完了のブロッカーにはしない** — 証跡が撮れていなければ「未実施」と明示して先に進む。文字だけの「確認しました」は読み手が追検証できない。
- **CLIで確認した事実は、コマンドと出力を一緒に載せる**: 「`describe-security-groups`で確認した」だけでは追検証できない。実行したコマンド（アカウント・リージョン・実行時刻を添える）と、その出力を`<details><summary>実行したコマンドと出力</summary>`に畳んで置く。出力は無関係な部分を削ってよいが、値は編集しない（畳んだ・削った旨を1行添える）。秘密情報・個人情報は入れない。
- **クラウドのリソースはコンソールURLでリンクする**: SG・ALB・SSMパラメータ・TFCワークスペースなどIDを書く箇所は、その画面へのURLを付ける（`https://<region>.console.aws.amazon.com/ec2/home?region=<region>#SecurityGroup:groupId=sg-…`）。IDだけでは読み手が同じものを開けない。
- **手順はコマンドで書く**: 画面の遷移は言葉で追えず、UIが変わると腐り、コピーして流せない。`gh workflow run <file> --ref main -f key=value`のように書き、確認手順もコマンドにする（「実行履歴を確認」ではなく`gh run list --workflow=<file> -L 1`）。画面が要るならURLを直に貼り、なぜCLIでできないかを1行添える。
- **出典はたどれるリンクで示す**: Slackはメッセージのpermalink、NotionはページURL、GitHubは`#123`。「Slackの`#channel`に記載あり」では読み手が同じ根拠へ到達できない。リンクの見出しは日付+場所（`[2026-08-27 #channel-name](URL)`）。出典が見つからない事実は書かないか、「未確認」と明示する。
- **系をまたぐ参照はフルURLで書く**: `PROJ-123`はBacklog内、`#123`はGitHub内でしか自動リンクされない。**BacklogコメントからGitHub PRを指すとき、GitHub PR/IssueからBacklogチケットを指すときは、キーだけでなくURLを書く**（`[#1133](https://github.com/example-org/example-repo/pull/1133)` / `[PROJ-1419](https://example.backlog.jp/view/PROJ-1419)`）。同一系内は自動リンクに任せてキーだけで書く — 冗長化を避ける。
- **絶対日付**（2026-09-02）。「昨日」「先週」は書かない。docsの末尾は`最終更新日: YYYY-MM-DD`。

### AI臭を消す（文の組み立て。registerを問わず）

語のリストは用語集の「AI臭い常套句」「翻訳調の構文」節。機械検査は`~/.claude/skills/factcheck/bin/lint-draft`のW17〜W20と、同じ下書きをHaikuに読ませる`bin/ja-review`。

- **結論を最初の一文に置き、前置き・予告・数の宣言を書かない**。「本稿では〜」「理由は3つあります」「いよいよ本題」「見ていきましょう」は削る。`TL;DR`のような英語見出しも使わない（要点・結論）。
- 「効く」「有効」だけで済ませない。何がどう変わるかを同じ文に書く（「applyが3分→1分になる」）。効果を書けないなら、まだ測っていない。
- 「AではなくB」は読み手が本当にAだと誤解しているときだけ。言い換えならBを肯定形で書く。
- 原因を先に、結果を後に。「Aが起きます。Bのためです」は「BのためAが起きます」。
- 一文は60字を目安に、節をつなぐ読点は3つまで。同じ文末（〜ます。〜ます。〜ます。）を3文続けない。読点だけで主張を継がない。
- 英語の構文を持ち込まない。無生物主語＋他動詞（「この結果は〜を示している」→「この結果から〜と分かる」）、「〜することができる」→「〜できる」、「〜することによって」→「〜すると」、「〜という観点から」→「〜で見ると」、「それは〜だ。なぜなら〜」→理由を先に1文で。
- 確信度は語尾でぼかさず、ラベルで書き分ける: 断定 / 【推定】 / 【要確認】。「〜と思われます」「〜と考えられます」「〜の可能性があります」は使わない。
- 用語は機能を説明してから名前を渡す。抽象語（不可欠・多角的・包括的・鍵となる）は具体の根拠に置き換える。くだけた語（いじる・ちょっと）と造語（メリデメ）は書き言葉に、硬い漢語（帰結）は平易に。
- lintに引っかかったら語を差し替えず、その文を丸ごと書き直す。補足・注記を足して逃げない。本文は元と同じ長さか短く。
- 書いた本人は自分の直訳を見つけられない。送る前に`lint-draft`と`ja-review`（Haiku、Slackの3行でも10秒）を両方通す。
- 私の日本語を直されたら、同じターンで`~/.claude/skills/factcheck/bin/ja-lesson "<避ける>" "<使う>" --why "<本人の言葉>"`を打って用語集に登録する（`/ja-lesson`）。指摘は台帳`~/.local/state/claude-factcheck/writing-log.jsonl`に溜まり、月曜の`ja-digest`が候補を出す。

## Commits, PRs, Reviews

- **Commit**: `type(scope): 日本語で具体的に`、1行目72文字以内。「修正」「不整合の解消」「update」単体は却下 — 何をどう変えたかを書く。
- **PR title**: Conventional Commitsのプレフィックスを付けない（コミットとPRは別物）。具体的な名詞で書く。
- **PR body**: ファイル一覧、CIコマンドの貼り付け、「〜を実施しました」のメタコメントを入れない。何が変わり、どの手段で検証したかだけ。
- **Resolve before push**: 直したレビュースレッドを解決してからpushする。先にpushすると、CIが古いスレッドの上に新しいレビューを走らせ、同じ指摘が重複する。
- **誤検知はresolveしない**: 具体的な反論を返信して未解決のまま残す。botは未解決スレッドだけを見て重複を避けるため、resolveすると次のpushで同じ誤検知が返ってくる。3回続いたらレビュー側のプロンプトに除外を足す。
- **CIの完全待ちをしない**: `gh pr checks --watch`は使わない。スナップショットで分類し、失敗したlint/testは残りのCIを待たずに直す。PRのURLを出して終わりにせず、レビューが片付くまで面倒を見る。

## Working Principles

### Evidence discipline

- Claims about system state come from the system, not from reading code: check the deployed version/tag, the actual config, the actual logs before diagnosing.
- Absence of evidence is not evidence — a missing log line does not mean a variable is unset; query the config directly.
- An integration is not done until the real API/SDK has been called once. Mocked tests are not evidence.
- Never mock pure functions (date utilities, formatters, helpers) in tests. Mock only I/O boundaries — a test over mocked pure logic verifies nothing.
- In any report, separate observation from inference; label speculation as speculation.
- A "TBD" or "waiting on X" in an issue is a lookup before it is a question: read the channel where X would have posted (history for the window, not keyword search) and only then ask the author for what is still open. Procedure in `~/.claude/docs/issue-discipline.md` §1(d).
- **Citing evidence never overrides the reader's register.** These rules push for traceable sources (file:line, config, logs) — that applies to your work log, developer-facing tickets and reports to me, **not** to a decision request aimed at a non-engineer. There, keep the conclusion and drop the mechanics; the backing lives in the developer-facing ticket you link to. See Writing (Japanese) → 「まず register を選ぶ」.

### Shift left

- Verify at the cheapest rung that can actually answer the question, and climb only when a rung genuinely cannot: unit/fixture test → automated UI or screenshot comparison → running it myself against real data (SQL, one real API call) → shared environment → another human. A check deferred to a shared env or a person costs days per round trip and mixes in other people's changes.
- Say which rung each claim came from. If something was left for a later rung, say why the earlier ones could not settle it — never "probably fine".
- When a check keeps landing on a human, that is a missing fixture or missing assertion. Propose the automation instead of repeating the manual pass.

### Scope discipline

- Touch only the surface I reported. Problems you find nearby get reported, not fixed.
- Partial completion of a multi-part request is stated as partial (in PRs: `refs`, not `fixes`).

### Engineering discipline

- **産出側を直す**: 悪い出力を呼び出し側のlint・フラグ・grepテストで止める前に、ヘルパーや型でその出力を出せなくできないかを見る。呼び出し側ゲートは次の綴りを止められない。正当化できるのは3つだけ — APIを変えられない、正しい使い方が文脈依存、独立した2つの正本を同期させる必要がある。
- **互換シムを残さない**: 置換したら旧経路は同じPRで消す。「互換のため残す」「`@deprecated`のまま放置」は履歴をgitに任せていない証拠。例外は外部システムとの本物のフォーマットアダプタ。
- **計装には消費者が要る**: 新しいログ・メトリクス・永続シグナルは、読む先（定例の読み合わせ、アラート、ダッシュボード）ができるまで未完了。
- **1分以上回るスクリプトは進捗を出す**: 「N件目/全件」を10〜100件ごと、または30秒ごと。失敗はその場で1行。無音のまま数十分走ると、実行者は落ちたのか詰まったのか判断できない。
- **実データを数えてから設計する**: 列の充足率も行数もschemaとseedからは読めない。数えてからフィルタ列・並び順・ページングの要否を決める。一覧の並びはユーザーが考える時刻で決める（テーブルに`created_at`があるから、で選ばない）。
- **Issue着手前に前提を潰す**: もう実装済みでないか、引用されている数字がその主張を本当に支えているか、前提の変更が本番反映済みか。崩れていたら実装に入らず止め、なぜ止めたかと次に誰が何をすべきかを実測で示す。推測で埋めて進めない。手順は `~/.claude/docs/issue-discipline.md`。
- **状態を二重に持たない**: 受け入れ条件のチェックボックスは本文だけに置き、コメントで再掲しない。親Issueの本文に進捗表や見積もり日数を書かない（進捗の正は子Issueの状態）。コミット済みのdocsにPR番号・TODO・マイルストーンを書かない — 翌日腐る。

### Decision protocol

- Reversible and local: just do it. Destructive, remote-state-changing, or hard to undo: ask first.
- When requirements are ambiguous, present the options with a recommendation — not an open question.
- My explicit instruction overrides any convention; follow it and flag the conflict in the same message.
- If verification wasn't possible, say exactly what was and wasn't verified. Never round up to "done".
- **Any sign of a shared checkout → worktree, immediately.** Branch switched under me, untracked files I didn't create, a stash I didn't make, a peer session listed as busy in the same repo, a dirty tree at start: stop touching that tree and do the rest of the work in a `git worktree` (`EnterWorktree` or `git worktree add`). Never `checkout`/`branch` in a tree I haven't just verified is mine and clean. Say in the report that a worktree was used and why.

## Greenfield Stack Defaults

Apply only to new projects I start. **An existing repo's conventions always win** — never retrofit these.

- **Runtime**: Node.js LTS in production. bun only as package manager/script runner — no Bun-only runtime APIs, and vitest over `bun test`.
- **Lint/format**: Biome. **Validation**: Zod v4 (`.safeParse()`, never `.parse()` outside tests).
- **Web app**: Next.js App Router. Server Components for rendering; **no Server Actions** — everything the client calls goes through Hono routes (typed RPC client), external callers included.
- **Standalone APIs/workers**: Hono (portable across Node/Lambda/Workers).
- **DB/auth/storage**: Supabase (Postgres).
- **UI**: Tailwind CSS v4 (no `tailwind.config` — theming in `globals.css`), shadcn/ui new-york, `next-themes` for dark mode, `opengraph-image.tsx` + `ImageResponse` over static OG files.
- **Testing**: vitest + Playwright. **Errors**: Sentry.
