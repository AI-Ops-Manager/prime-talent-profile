# Prime 向け MCP の接続と、取れるデータ

タレントのデータは AOM のタレントベース（talent-hub）にある。Prime のパートナー各社には、
AOM が割り当てたタレントのリストだけを読める MCP サーバーが用意されている。
Claude Code からこれに接続すると、`search_talents` と `get_talent` の2つのツールが使える。
返ってくるプロフィールは匿名化済みで、実名の代わりに表示ラベルで識別する。

## 接続

接続先の URL は会社ごとに違う（会社名のサブドメインが付く）。URL は AOM から案内を受ける。

いちばん簡単なのは `npm run setup` の「Prime 向け MCP の URL またはテナント名」に答えること。
リポジトリ直下の `.mcp.json` に `talent-hub-prime` として登録され、同じリポジトリを開く人全員に効く（commit してよい）。
手で登録するなら次でも同じ。

```bash
claude mcp add --transport http talent-hub-prime <案内されたURL>
```

Claude Code を起動して `/mcp` を開き、`talent-hub-prime` を選ぶとブラウザでログイン画面が開く。
Prime のアカウント（AOM から招待を受けたメールアドレス）でログインすると接続が完了する。
認証はアカウント単位なので、同じ会社でも人ごとに一度ずつ行う。

接続できたか確かめるには、Claude に「search_talents を引数なしで呼んで、件数と返り値の項目名を教えて」と頼む。
このとき控えた項目名が、以降の作業の正になる（下の表はツール定義から起こしたもので、項目名は環境で変わりうる）。

## ツール

| ツール | 引数 | 返るもの |
|---|---|---|
| `search_talents` | `keyword`（任意） | 割り当てリストの全員。keyword を渡すと、表示ラベル・サブラベル・自己紹介・匿名化済みの経歴・プロジェクトを横断して部分一致で絞り込む。空白区切りの複数語は AND。`matches` に「誰の、どの項目の、どこに当たったか」（項目名・抜粋・強調位置）が付く |
| `get_talent` | `id`（UUID） | 1人分の匿名化プロフィール。スキル・匿名化済みの経歴・プロジェクト・タグに加え、`schedulingUrl`（本人の30分面談の予約リンク。未設定なら null）が付く |

割り当てリストは数名〜数十名なので、まず引数なしで全員を一覧にし、要件の固有名詞で `keyword` を引いて
`matches` の抜粋で当たりを付け、気になる人を `get_talent` で読む、という順が速い（`talent-pickup` スキルの手順）。

## get_talent が返すフィールドと、プロフィールでの使い先

| フィールド | 中身 | 使い先 |
|---|---|---|
| `id` | UUID | `talent.json` の `_note` に控える（資料には出さない） |
| 表示ラベル・サブラベル | 匿名化された呼び名と一言 | **ラベルそのものは資料に出さない**。イニシャル形式ならそのまま `initials` に。そうでなければ AOM に確認 |
| `bio` | 自己紹介文 | 概要の素材 |
| `availabilityStatus` | available / partially_available / on_assignment / unavailable | `availability` |
| `availabilityCapacity` | 稼働できる時間数（週あたりで登録されていることが多い） | 稼働目安の素材。単位が不明なら「応相談」 |
| `devSkillLevel` | none / vibecoding / junior / mid / senior / lead / principal | 肩書きと本文の表現の上限を決める |
| `aiSkillLevel` | tool_user / prompt_engineer / developer / expert | 同上 |
| `workPreference` | remote / onsite / hybrid | 勤務スタイル |
| `aiSkills[]` / `devSkills[]` | `{ name, category, proficiency }` | スキル。`proficiency` は professional=実務 / personal=個人開発 |
| `experiences[]` | 匿名化済みの所属（業種表現）・役職・説明・期間 | 経歴。所属表記はそのまま使える |
| `projects[]` | `{ title, description, link }` | プロジェクト。`description` が空のものは実績に数えない |
| `tags[]` | `{ type: role / job_field / industry, nameJa, nameEn }` | 対応領域（役割 / 職種 / 業界） |
| `schedulingUrl` | 本人の面談予約リンク | **資料にも `_note` にも書かない。** 面談の窓口は名義の会社（CTA の文言どおり） |
| `photoUrl` | 署名付きURL（返る環境と返らない環境がある） | 返るなら `npm run photo -- <slug> "<url>"` で即保存する。1時間ほどで失効する。返らなければイニシャル枠で作るか、AOM に写真の提供を頼む |

## この MCP から取れないもの

ランク、稼働不可のフラグ、面談の有無、他案件との掛け持ち状況は返ってこない。
これらは AOM 側で管理しているので、候補を提示する前に AOM の担当に照会する（`docs/selection-guide.md`）。
割り当てリストに入っている時点で AOM の一次選別は通っているが、稼働の最新状態は変わる。

## MCP を使わない場合

AOM からタレントのデータシート（上と同じ項目）を受け取り、`talent.json` に起こす。
手順と伏せ方は `talent-profile` スキルと同じ。データシートに実名が入っている場合は、リポジトリに置かない。
