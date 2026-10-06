# スキル登録簿

どのスキル・道具を、どの場面とリポジトリで使うか。CLAUDE.mdの「Skills」から引く。
自作のものと、skills.sh由来のうち実際に呼ぶものだけを載せる。入れたが呼んでいないものは載せない。

このリポジトリは公開なので、客先の名前・ID・内部URLは書かない。客先に紐づくスキルは`<client>-`を頭に付けた実名で入っていて、その中身は客先が持つオーバーレイのリポジトリにある。

## 置き場は4層

`~/.claude/skills/`には4つの出所が混ざる。1つのスキルのディレクトリの中で、コアと客先の値が別の層から来ることもある。

| 層 | 実体 | 張り方 | 何を置くか |
|---|---|---|---|
| dotfiles | `~/mac-setup`（公開） | `./scripts/stow.sh` | 全機共通で客先に依らないもの。`CLAUDE.md`・`settings.json`・`docs/`・`commands/`・`agents/`と、ここに挙げた4スキル |
| 共通スキル | `nerixim/claude-skills`（非公開） | 同リポジトリの`./install.sh <名前>` | 客先を問わないコア。`local/`は読むだけで持たない |
| 客先オーバーレイ | 客先が持つリポジトリ | そのリポジトリの`./install.sh` | `<スキル>/local/`（設定・名簿・地図・チャンネル）と、客先専用スキルそのもの |
| skills.sh | `npx skills` | `npx skills install -g` | 第三者のスキル。月曜のjobが更新するのはこの層だけ |

判別は`ls -l ~/.claude/skills/<名前>/`でリンク先を見る。どこにも張られていない実ファイルがあれば、それはまだどのリポジトリにも入っていない。

## 自作スキル

| スキル | 使う場面 | 層 | 前提 |
|---|---|---|---|
| `briefing` | 「何か来ているか」「何を見落としたか」。Slack・GitHub・Notion・Googleを1回で読み、要対応/待ち/情報のみの3つに分ける | 共通＋オーバーレイ | `local/config.json`と`local/people.json`。SlackとGoogleはMCP経由なので、出た呼び出しを打って結果を保存する |
| `meeting-prep` | 定例の前に読み上げるメモを作る。会議のあとは`notes`で決定事項を記録する | 共通＋オーバーレイ | `local/meetings.md`（プロファイル・議題・人・ブロックの材料）。`briefing`を先に回す |
| `factcheck` | 送る前に下書きを正本に当てる。GitHub・Slack・Notion・クラウドの主張を再取得して照合し、文体とregisterもlintする。**送信はしない** | 共通＋オーバーレイ | `local/sources.json`。記法のW01〜W04・W22・W23は`mdfmt`に委ねるので`bun`が要る |
| `writing` | 送る文を、同僚が実際に書いた文の分布に合わせて書く。場面を選び、実測の型と実物を読んでから書き、書いたあと外れを出す。**送信はしない** | 共通＋オーバーレイ | `local/config.json`（ダンプの置き場と名簿）。コーパスは`~/.local/state/claude-writing/`に置き、リポジトリには入れない |
| `ja-lesson` | 自分の日本語を直されたその場で用語集に登録する | 共通 | `factcheck/bin`を呼ぶ |
| `grill` | 実装前・受け入れ基準を書く前に、案やチケットを質問で詰める | 共通＋オーバーレイ | `local/ticket-source.md`。無ければ引数を自由記述として扱う |
| `quiz` | 製品の挙動を自分が答えられるか試す。マージ済みPRから事実を収穫し、間隔をあけて出題する | 共通＋オーバーレイ | リポジトリごとの`$Q/config.md`。`local/config.<repo>.md`が種 |
| `work-report` | 月末の作業報告書（xlsm）を埋める。カレンダー・自分のSlack投稿・GitHub・git・Claude Codeのセッションから日ごとの作業を起こし、休日と欠勤は勤怠チャンネルから取る。手で呼ぶときだけ（`/work-report 2026-09`） | 共通＋オーバーレイ | `local/config.json`（勤怠チャンネル・定例名・リポジトリ・テンプレートの配置・文言規則）。`uv`と`openpyxl` |
| `start-work` | 作業単位（PRになるもの・apply・文書・調査結果）に着手する前にissueを1本切り、自分に割り当てて、チームのGitHub Projectに列付きで載せる。本文はリポジトリの流儀で書く（issue作成エージェントを持つリポジトリはそれに委ねる）。PRは`refs`/`Closes`でissueを指し、`pr`・`status`で列を動かす。`backfill`がissueの無い自分のPRと板に無いissueを並べる。返信・DM・人に関するメモはissueにしない（`briefing`の板に置く） | 共通＋オーバーレイ | `local/config.json`（org・Project番号・列名）と`local/issue-style.md`。`gh`に`project` scope。本文は`mdfmt`と`factcheck/bin/lint-draft`を通る |
| `mdfmt` | Markdownの記法を機械で見る。Slack宛と、GitHub・Backlog宛で規則が違う | dotfiles | `bun`。`bun test`が31件 |
| `commit` | 日本語の説明でConventional Commitsのコミットを作る。compile・lint・testも回す | dotfiles | — |
| `greenfield` | 新規プロジェクトのスタック既定（Node LTS・Biome・Zod v4・Next.js+Hono・Supabase・Tailwind v4・vitest+Playwright）。既存repoには当てない | dotfiles | — |
| `create-pr` | 日本語のタイトルと本文でPRを出す | dotfiles | `gh` |
| `creating-infra-overviews` | 「どこで何が動いているか」の俯瞰図を作る | dotfiles | — |
| `premortem` | 決定・計画が失敗した前提で原因を洗う | dotfiles | — |
| `<client>-alert-triage` | 客先のインフラ発報の棚卸し。Slack・Datadog・CloudWatch・AWS Health・TFCを突き合わせ、runbookを実機と照合する | 客先 | 客先のクラウド権限 |
| `<client>-notion` | 客先のNotionコピーから仕様・障害・議事録・名簿を引く。`--page`で今の本文も見る | 客先 | ローカルのミラーとゲスト用MCP |

`briefing`のトラッカーはアダプタになっていて、GitHubは実装済み、Backlogは契約だけ書いた雛形。客先が変わってもエンジンは同じで、`lib/trackers/`に1つ足す。

## skills.sh由来で実際に呼ぶもの

| スキル | いつ |
|---|---|
| `terraform-style-guide` / `terraform-test` | Terraformを書く・直すとき（IaCのリポジトリが複数ある） |
| `aws-containers` / `aws-observability` / `aws-billing-and-cost-management` | ECS・監視・費用を触るとき。内部知識で答えず先に読む |
| `kotlin-patterns` / `kotlin-springboot` / `springboot-security` | Kotlin＋Spring Bootのアプリを読むとき |
| `vue` | `.vue`を触るとき |
| `security-reviewer` | 脆弱性の棚卸しと監査報告 |
| `tdd` / `codebase-design` / `domain-modeling` / `improve-codebase-architecture` | 設計と作り方を決めるとき |
| `handoff` / `triage` | 引き継ぎ文書、Issueの仕分け |
| `retro` / `diagnosing-superpowers` | セッションのあとの振り返り。`/retro`は環境（ナビゲーション・自動チェック・道具の経済・CLAUDE.mdの肥大）の改善候補を出す。`diagnosing-superpowers`はトランスクリプトから失敗・手戻りを`path:line`付きで出す。どちらも過去セッションのJSONLのパスを渡せば`claude -p`でも回る（2026-10-01に実セッションで確認、1本0.3〜0.4 USD） |
| `retrospective-codify` | 試行錯誤のあとに教訓をlint規則・スキル・CLAUDE.mdのどれに落とすか決める。明示的に呼んだときだけ |
| `verification-before-completion` | 完了・修正済みと言う前に検証コマンドを回して出力を読む |
| `gh-fix-ci` | PRのCIが赤いとき。`gh`でログを引いて修正案を出し、承認後に直す |
| `writing-for-agents` | スキル・CLAUDE.mdを書き直すとき。`retro`が最初に呼ぶ |
| `bigquery-troubleshooting` / `bigquery-optimization` / `cloud-monitoring-metric-selection` / `cloud-logging-query-generation` | GCP側（BigQuery・Cloud Monitoring・Cloud Logging）を触るとき。内部知識で答えず先に読む |
| `aws-github-oidc-scoped-role` | GitHub ActionsからAWSへのOIDC信頼を書く・レビューするとき。`job_workflow_ref`で絞る型（2026-10-01の盲検評価でTerraformの基準を8点上回り、OIDCの`sub`ワイルドカードとcircuit breaker無しを両方当てた唯一の候補） |

2026-10-01の盲検評価で見送ったもの: mattpocock `diagnosing-bugs`・`code-review`、sanyuan0704 `code-review-expert`、obra `systematic-debugging`、hashicorp `refactor-module`、mizchi `aws-ecs-codedeploy-blue-green`。KotlinのPRレビューでもTerraformでも基準（スキル無し）と同等以下だった。mattpocockの`code-review`は組み込みの`/code-review`と名前が衝突するので、入れるとしても別名が要る。

更新は月曜09:30のlaunchd（`com.nikita.skills-update`）が`~/.local/bin/skills-update`を回す。触るのはこの層だけで、自作スキルは動かさない。

## コマンド・エージェント・道具

| もの | 実体 | 使う場面 |
|---|---|---|
| `/debrief` `/spark` `/pr-review` `/localize` | `~/.claude/commands/` | 振り返り、発想、PRレビュー対応、翻訳 |
| `commit-message-writer` / `pr-creator` | `~/.claude/agents/` | コミット文・PR本文を別エージェントに書かせるとき |
| `tfc-run` | `~/.local/bin/` | Terraform Cloudのrunを1行で見る・discardする・applyする |
| `skills-update` | `~/.local/bin/` | skills.sh層の更新と静的チェック。月曜のjobが呼ぶ |
| gh投稿のゲート | `settings.json`の`PreToolUse` | `gh issue|pr comment|create|edit|review`の本文をlintに通し、指摘があれば止める。`factcheck`が無い機では素通し |

`~/.claude/commands-archive/`は退役したコマンド。読み込まれないので、戻すときは`commands/`へ移す。

## 増やすときの置き場

1. 客先の値（ID・人・チャンネル・アカウント）を持つか → 持つなら客先のオーバーレイ。コアには置かない
2. 客先を問わないコアがあるか → あるなら`nerixim/claude-skills`。`local/`を読む形にして、`local/`が空でも動くか、例のファイル名を出して落ちるようにする
3. どの機でも同じで設定を持たないか → `~/mac-setup`。ただし公開リポジトリなので客先の名前を入れない
4. 第三者のものをそのまま使うか → skills.shで入れる。手で直さない（月曜の更新で消える）

最終更新日: 2026-10-01
