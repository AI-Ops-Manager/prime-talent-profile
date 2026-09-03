# Prime 向け MCP の仕様と読み方

## ツール

| ツール | 引数 | 返るもの |
|---|---|---|
| `search_talents` | `keyword`（任意） | 割り当てリストの全員（匿名化済み）。keyword を渡すと絞り込み＋`matches`（talentId → 当たった項目・抜粋・強調位置） |
| `get_talent` | `id`（UUID） | 1人分。匿名化済みの経歴・プロジェクト・タグ・スキルと `schedulingUrl` |

MCP のサーバー名は接続時に付けた名前（既定 `talent-hub-prime`）。ツールが見えないときは ToolSearch で `talent` を検索して読み込む。
返り値の項目名は初回接続時に実物で控える（`docs/mcp-setup.md` の表はツール定義から起こしたもの）。

## 知らないと精度が落ちること

1. **`keyword` は表示ラベル・サブラベル・自己紹介・経歴・プロジェクトを横断する。** 空白区切りは AND、各語は大文字小文字を区別しない部分一致。`matches` がどこに当たったかを返すので、`get_talent` の前に一次判定ができる
2. **短い略語は誤ヒットが多い**（PM が「PMF」「PMI」を拾う）。`matches` の抜粋で文脈を確かめる
3. **表記ゆれは別クエリ**（GAS と Google Apps Script は互いを拾わない）
4. **`get_talent` にランク・不可フラグ・面談の有無は無い。** AOM への照会事項（SKILL.md の 5）
5. **UUID はフル桁で控える。** 先頭だけメモすると `get_talent` が Talent not found になる
6. **`schedulingUrl` は本人直通の予約リンク。** レポート・資料・チャットのどこにも転記しない（面談の窓口は名義の会社）
7. **写真URLが返る環境では署名付きで短時間で失効する。** 使うなら `npm run photo -- <slug> "<url>"` で即保存
8. **プロフィールの充実度に差がある。** 「記載がない」は「できない」ではなく「情報不足」。有力なら AOM に実績の補足を頼む
9. **`projects[].description` が null のものは実績に数えない**

## 列挙値

- `availabilityStatus`: available / partially_available / on_assignment / unavailable
- `devSkillLevel`: none / vibecoding / junior / mid / senior / lead / principal
- `aiSkillLevel`: tool_user / prompt_engineer / developer / expert
- `workPreference`: remote / onsite / hybrid
- `aiSkills[].proficiency` / `devSkills[].proficiency`: professional / personal
- `tags[].type`: role / job_field / industry

## 一覧の持ち方

レスポンスは長い。必要な列だけ抜いた表にする。

| id | ラベル（作業用） | 稼働 | 時間 | dev | ai | 主なスキル | 見つけた経路（全件 / keyword「◯◯」） |
|---|---|---|---|---|---|---|---|

`get_talent` の結果はファイルに保存してから要点だけ抜くと、同じ人を何度も引かずに済む。

## 読み方の勘どころ

- 要件の固有技術名詞は、`keyword` で引いて `matches` の抜粋を見るのが最初の一手。`aiSkills` / `devSkills` のタグに無くても、プロジェクトの本文に書いている人はこれで浮く
- 「ガバナンス」「DX」「業務改善」のような広い語は、何の話かを description で確かめる
- 経歴の所属は匿名化済みの業種表現で返る。そのまま資料に使える
- `availabilityCapacity` は週あたりの時間として登録されていることが多い。月換算は「×4 の目安」と断って書き、確定は本人確認に回す
