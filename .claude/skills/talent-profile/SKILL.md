---
name: talent-profile
description: タレント1名のブラインドプロフィール（A4縦・2〜3ページのPDF）を、このリポジトリの名義で作る。「〇〇さんの紹介資料を作って」「この人のプロフィールをPDFに」「ブラインド版を作って」「こんな人いますよ資料」と言われたら必ず使う。データの取得から talent.json の作成、描画、確認、PDFの仕上げまでをこの手順で通す。候補を探す段階は talent-pickup。
---

# talent-profile — ブラインドプロフィールの作成

成果物は `out/<slug>/profile.pdf`。中身は `talents/<slug>/talent.json` で、見た目は `brand/brand.json` が決める。
テンプレートには触らない。分量が溢れたら文章を削る。

参照: [references/data-mapping.md](references/data-mapping.md)（get_talent から talent.json への写し方）、
[references/blind-rules.md](references/blind-rules.md)（伏せるもの・残すもの）、
[references/qa-checklist.md](references/qa-checklist.md)（出す前の確認）。

## 0. 入力の確認

- **ブランドが設定済みか**: `brand/brand.json` の `brandName` が `YOUR BRAND` のままなら、先に `brand-setup` を通す
- **対象**: UUID（`talent-pickup` のレポートにある）か、依頼文の名前。名前しか無ければ `search_talents` で探して UUID を控える
- **用途**: 打診先や案件が分かっていれば「希望領域」の一行と、プロジェクトの並び順をそこに寄せる
- **写真**: 出す運用か伏せる運用か（`brand.json` の `defaults.hidePhoto` が正。個別に伏せたいときは `photo: null`）
- **単価**: 表示は `brand.json` の `defaults.rate` が既定。案件で個別の取り決めがあるときだけ `facts.rate` に書く

指示に無いことは1回だけまとめて聞く。聞かずに進められるなら、仮定を報告に書いて進める。

## 1. データを取る

`get_talent` で1人分を読む。`experiences` と `projects` を両方読み、`tags` と `aiSkills` / `devSkills` も控える。
MCP が無ければ AOM から受け取ったデータシートを同じ項目として読む。データシートはリポジトリに置かない。

読みながら決めること:

- **肩書き（`role`）**: 実績に見合う一行。`devSkillLevel` が none / vibecoding / junior なら「エンジニア」「開発リード」を名乗らせない
  （「PdM × AI活用 × 実装まで自走」のような表現に留める）。principal / lead / senior なら実装の担い手として書いてよい
- **イニシャル**: MCP の表示ラベルがイニシャル形式ならそれを使う。そうでなければ AOM に確認する（実名から作るときは頭文字だけ。資料内で統一）
- **面談予約リンク**: `schedulingUrl` が返っても資料・`_note` に書かない。面談の窓口は名義の会社
- **写真**: `photoUrl` が返り、出す運用なら**その場で**保存する。URL は1時間ほどで失効する。返らない環境ではイニシャル枠で作る

```bash
npm run photo -- <slug> "<photoUrl>"
```

## 2. talent.json を書く

`talents/_example/talent.json` を複製して埋める。写し方の細則は [references/data-mapping.md](references/data-mapping.md)。

- 概要は2段落。1段落目=何者かと一番の強み（**太字**は1箇所）、2段落目=いまの取り組みと評価されている点
- 経歴は新しい順に3〜4件。本文は「何を、どこからどこまで担ったか」を2文以内
- プロジェクトは3〜5件。代表2件を `featured: true` に。`description` が空のものは載せない
- 数字はデータの記載どおり。丸めない、足さない
- 伏せる線引きは [references/blind-rules.md](references/blind-rules.md)。現職・自社の社名は業種表現に
- `_note` に UUID と、確認が残っている点（稼働・所在地・単価）を書いておく（資料には出ない）

書き終えたら `npm run check -- <slug>` を通す。

## 3. 描く

```bash
npm run render -- <slug>
```

`out/<slug>/p-1.png` から最後のページまで、**全部を Read で開いて見る**。
「ページ N が X.Xmm はみ出しています」と出たら、`docs/design.md` の順（言い回しを削る → 件数を減らす → 4ページに割る）で直して描き直す。
フォントサイズと余白は触らない。

## 4. 確認する

[references/qa-checklist.md](references/qa-checklist.md) を1項目ずつ潰す。飛ばさない。
特に、氏名・連絡先・SNS・現職社名が一切出ていないことと、単価・稼働の表示が取り決めどおりであること。

## 5. 仕上げる

- PDF のファイル名は `タレントプロフィール_<INITIALS>_ブラインド版.pdf`（`out/<slug>/profile.pdf` を複製して改名）
- 保存先は自社の運用に従う（共有ドライブ等）。`out/` は git に入らない
- 報告に添える: UUID、仮定した事項、残っている確認（稼働の本人確認・所在地・単価の取り決め）、はみ出しを削った箇所

同じ人を別の打診先向けに作り直すときは、`talents/<slug>/talent.json` を上書きせず、`talents/<slug>-<打診先>/` に複製して直す。
