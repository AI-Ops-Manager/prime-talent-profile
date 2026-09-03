# get_talent から talent.json への写し方

左が `get_talent` の返り値、右が `talents/<slug>/talent.json`。項目の定義は `template/talent.schema.json`。

## 上部

| 元 | 先 | 写し方 |
|---|---|---|
| 表示ラベル（`displayLabel` 等） | `initials` | Prime 向け MCP の表示ラベルは匿名化済み。イニシャル形式ならそのまま使い、そうでなければ AOM に確認する。実名が分かる場合も頭文字だけ（例: 山田太郎 → T.Y.）にし、名前そのものは書かない |
| `bio` / experiences の役職 | `role` | 英語の肩書き一行。実績と `devSkillLevel` に見合う表現（SKILL.md の 1） |
| （生成日） | `issued` | `YYYY.MM`。省略すれば生成日 |
| `availabilityStatus` | `availability` | そのまま。unavailable の人の資料は作らない |
| `photoUrl`（返る環境のみ） | `photo` | `npm run photo` が保存してファイル名を書く。返らない環境や伏せる運用なら null |

## 基本情報（`facts`）

| 元 | 先 | 写し方 |
|---|---|---|
| `availabilityCapacity` | `hours` | 週あたりの登録が多い。「月 40h〜」のように月換算で書き、換算したことを `_note` に残す。単位が不明なら null（→「応相談」） |
| — | `hoursNote` | null でブランド既定（「増減ご相談可」） |
| 取り決め | `rate` / `rateNote` | 既定はブランド設定。案件で個別に決まっているときだけ書く |
| — | `start` | 分かれば「即日（応相談）」「2026年10月〜」。不明なら null |
| — | `contract` | null でブランド既定（業務委託（準委任）） |
| `workPreference` | `workStyle` | remote → 「フルリモート主体」、hybrid → 「リモート主体（来社応相談）」、onsite → 「常駐可」 |
| 打診先の文脈 | `focus` | 全角20文字以内。「バックオフィス業務のAI化 × 実装」のように領域×役割 |

## 概要（`overview`）

`bio` を素材に2段落へ再構成する。bio をそのまま貼らない。

- 1段落目: 経歴の骨格（何年、何を、どの立場で）と一番の強み。強みの一文だけ `**太字**`
- 2段落目: いまの取り組み（projects のうち featured のもの）と、評価されている点。数字があれば入れる
- 各段落3〜4行（全角120〜160文字）。3段落にしない

## 解決できる課題と推薦理由（`fit` / `points`）

| 元 | 先 | 写し方 |
|---|---|---|
| 案件があれば要件の MUST / WANT と商談メモの発言（`talent-pickup` レポートの「案件要件」）。無ければ本人の `projects` が実際に解いた課題 | `fit` | 読み手企業の状況を客観の文で1行に（全角35字以内）。3点。口語・呼びかけにしない。要件にも実績にも無い課題を足さない |
| `experiences` / `projects` の数字、レポートの「この案件で効くところ」 | `points` | 課題の順に対応させて4点。各1〜2行、実績の数字入り、太字は1箇所。文末は事実の言い切り（〜できる／〜の知見を持つ） |

2節を書くと2ページ目の先頭が 解決できる課題→推薦理由 になり、スキルは1ページ目、対応領域は3ページ目の先頭に移る（概要は1段落・実績は3件に）。

## 対応領域（`coverage`）

| 元 | 先 |
|---|---|
| `tags[type=role].nameJa` | `roles` |
| `tags[type=job_field].nameJa` | `jobFields` |
| `tags[type=industry].nameJa` | `industries` |

各行4つまで。5つ以上あるときは案件に近いものを残す。

## 経歴（`career`）

`experiences` を新しい順に3〜4件。

| 元 | 先 | 写し方 |
|---|---|---|
| `startDate` / `endDate` | `period` | 「2013 — 2025」「2021 — 現在」。月は書かない |
| 匿名化済みの所属表記 | `org` | Prime 向け MCP はそのまま使える。実名の社名が返る環境では、現職・自社を業種表現に（blind-rules.md）。過去の大手は実名可 |
| `title` | `title` | 役職。変遷は「取締役 → 代表取締役CSO」 |
| — | `note` | 社名を伏せたときは「※社名はご面談時に開示」 |
| `description` の要旨 | `headline` | その期間の要約を名詞句で |
| `description` | `body` | 2文以内。何をリードし、どこからどこまで担ったか。数字は記載どおり |

`description` が空の経歴は、`headline` を役職から作り `body` を null にする。話を作らない。

## スキル（`skills`）

`aiSkills` と `devSkills` を `category` でまとめて 4グループまで。

| category | グループ名の例 |
|---|---|
| llm | LLM |
| ai_coding_tool | AIコーディングツール |
| ai_agent | AIエージェント |
| generative_ai | 生成AI（画像・音声） |
| programming_language / frontend / backend | 開発 |
| infrastructure / cloud / database | インフラ・バージョン管理 |

`level` は `proficiency` から: professional / advanced / intermediate → 「実務」、personal → 「個人開発」。混在するグループは多い方。
1グループのタグは4つまで。多ければ案件に近いものを残す。

## 実績（`projects`）

| 元 | 先 | 写し方 |
|---|---|---|
| `title` | `name` | そのまま。社名が入っていれば業種表現に |
| `link` | `badge` | link あり → 「公開」、無し → 「社内利用」（適切な語があればそれ） |
| `description` の1文目 | `subtitle` | 一言の説明 |
| `description` | `body` | ラベル付きの2件は3行、他は2行以内 |
| `description` 中のツール名 | `tools` | 「Claude Code・GitHub・Vercel」のように中黒区切り |
| 課題との対応 | `featured` | 課題に合う2件を true（資料では「適合」、汎用は「注目」のラベル） |

`description` が null のものは載せない。

## 出さないフィールド

`email` `phone` `birthday`、表示名や表示ラベルそのもの、**`schedulingUrl`（本人の面談予約リンク）**、`photoUrl` の文字列そのもの。
資料にも `_note` にも書かない。面談の設定は名義の会社が窓口になる（CTA の文言どおり）。
