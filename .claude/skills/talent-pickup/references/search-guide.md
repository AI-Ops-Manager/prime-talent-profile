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

## 案件タイプ別のキーワード例

実案件で当たりが出た語と、部分一致の性質上ノイズが多い語。`keyword` は経歴・プロジェクト本文まで横断するので、
案件の MUST にある固有の技術名詞・業務名詞は、短くても単体で1本立てる（3件しか当たらなくても本命を直撃することがある）。
複数のクエリに重なって当たる人は強いシグナル。

| 案件タイプ | 当たりが出やすい語 | ノイズが多い・当たりにくい語 |
|---|---|---|
| 営業Ops・提案書生成 | 提案書 / 営業資料 / SFA / HubSpot / 文字起こし / 商談 / RevOps / 追客 | 営業（広すぎる）/ 新興ツール名 |
| バックオフィス・管理業務 | 勤怠 / 書類 / 経理 / 請求 / インボイス / OCR / バックオフィス | シフト |
| 業務自動化 | 自動化 / Dify / n8n / Zapier / GAS / Google Apps Script / ワークフロー | — |
| RAG・社内チャットボット | RAG / チャットボット / ナレッジ / 社内問い合わせ / LangChain | — |
| LLM運用・品質担保 | Langfuse / LangSmith / 運用基盤 / 監視 / トレース | LLMOps / オブザーバビリティ（登録者がほぼ使わない語） |
| Claude Code基盤構築 | サブエージェント / フック / ヘッドレス / Claude Code Action | — |
| 製造・工場 | 製造 / 工場 / 生産管理 / 工程 / 設備 / IoT / 自動車 | 品質・生産（部分一致で別文脈を拾う） |
| 建設・不動産 | 建築 / リフォーム / 施工 / 見積 / 現調 | — |
| 宿泊・店舗・現場オペ | ホテル / 観光 / 接客 / 店舗 | 旅館 / 宿泊 |
| 研修・伴走・内製化 | 研修 / セミナー / 教育 / 伴走 / リテラシー / 内製化 / ヒアリング | 組織開発の一般語 |
| 新興職種（FDE/GTM/AIO） | FDE / GTM / LLMO / AEO / AIO / CAIO（略語のほうが当たる） | 英語の正式名称 |
| 経営レイヤー・顧問 | 顧問 / 伴走（補助的に） | 経営 / CxO（ノイズが多い）。経歴の役職語で判定する |
| 画像・動画生成 | Runway / Sora / ElevenLabs / ComfyUI（ツール名で） | 動画生成 / 動画 |

### 語の落とし穴

- **2〜3文字の略語は文脈確認が必須**（PM は「PMF」「PMI」、EM は「G**em**ini」を拾う）
- **同綴りの誤ヒット**: GTM = Google Tag Manager、Copilot = GitHub Copilot、Meta = メタ認知
- **表記ゆれは別クエリ**: GAS と Google Apps Script は互いを拾わない
- **「ガバナンス」は4種類に散る**（IT基盤統制 / AI政策 / コーポレート / 組織運営）。何のガバナンスかを本文で分ける
