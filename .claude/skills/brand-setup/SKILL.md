---
name: brand-setup
description: このリポジトリの発行名義（ロゴ・キーカラー・会社名・定型文）を brand/brand.json に設定し、サンプルを描いて見え方を確かめる。「ロゴと色を設定して」「ブランドを変えたい」「うちのトンマナにして」「色味を直して」と言われたとき、初回のセットアップと、あとからの調整の両方で使う。
---

# brand-setup — 発行名義の設定

会社固有の情報は `brand/brand.json` とロゴファイルだけ。ここを一度決めると、以降に作るプロフィールは全部同じ体裁になる。
設定項目の説明は `brand/brand.schema.json` にある。

## 1. 聞くこと（無ければ1回だけまとめて聞く）

- ブランド名（資料に出す名義。例: Sample AI Partner）と会社名（例: 株式会社サンプル）
- キーカラー1色（HEX）。ブランドガイドラインがあれば、そのメインカラー
- ロゴファイル（SVG が望ましい。PNG なら透過・横幅800px以上）。無ければ文字で代替できる
- 写真を出す運用か、伏せる運用か（`defaults.hidePhoto`）
- 参考単価の既定表示（例: 「商談時にご共有」「15,000円/h〜」）。AOM との取り決めに従う
- 仕上がった PDF を置くフォルダ（既定はデスクトップ。共有ドライブにしたければそのパス。人ごとの設定で git には入らない）
- Prime 向け MCP の URL またはテナント名（AOM から案内があれば。`.mcp.json` に登録される）

ガイドラインPDFや既存資料を渡されたら、そこから色・ロゴ・表記を拾って提案し、確認を取る。

## 2. 書く

対話が済んでいるなら非対話で書ける。

```bash
npm run setup -- --non-interactive --name "<ブランド名>" --company "<会社名>" --accent "#RRGGBB" --logo <ロゴのパス> --no-preview
```

写真を伏せる運用なら `--hide-photo`、PDF の保存先を変えるなら `--deliver-dir <フォルダ>`、MCP の接続先があれば `--mcp-url <URLかテナント名>` を足す。単価の既定表示や定型文（`labels`）を変えるときは、書かれた `brand/brand.json` を直接編集する。
既に `brand/brand.json` がある状態で再実行すると、名義・色・ロゴだけが置き換わり、手で直した `labels` と `defaults` は残る。
AOM 自身の名義で出すときは `npm run setup -- --preset aom` を土台にする。

ロゴが SVG で `fill="currentColor"` を使っていれば `logo.color` を `accent` か `ink` にして色を合わせられる。
色が固定された SVG や PNG は `original` のまま。ロゴは svg / png / jpg / webp のどれか。

## 3. 描いて見る

```bash
npm run check
npm run preview
```

`preview/_example/p-1.png` `p-2.png` `p-3.png` を Read で開いて確認する。

- ヘッダーのロゴが 7mm 高で読めるか（横長ロゴは `logo.height` を 5〜6mm に、正方形に近いロゴは 8mm に）
- 肩書きと「稼働可能」タグの文字色が白地で読めるか（明るいキーカラーは文字用に自動で暗くなる。その色が合わなければ `colors.accentText` に文字用の色を直接書く。罫線とタグの枠には `accent` がそのまま使われる）
- 最終ページの案内ブロックのロゴ・会社名
- フッターの名義表記（`labels.footer`。省略時は「ブランド名（会社名）」）

直したら `npm run preview` からやり直す。

## 4. 残す

`brand/brand.json` とロゴを commit して push する。GitHub Actions が `preview/` を描き直し、README の画像が自社の体裁に変わる。
ロゴファイルは `brand/` 直下に1〜2点だけ置く（使わない版を溜めない）。他社のロゴ・色をこのリポジトリに入れない。
