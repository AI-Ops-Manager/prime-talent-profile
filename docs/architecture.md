# 仕組み（保守する人向け）

入力は2つのJSON、出力はPDF。間にあるのはテンプレート1枚とNodeスクリプトだけ。

```
brand/brand.json ─┐
                  ├─ scripts/render.mjs ─→ template/profile.njk ─→ HTML ─→ Chrome(puppeteer) ─→ PDF + PNG
talents/<slug>/talent.json ─┘                                                     └─ はみ出し検知
```

ブランド設定はどのプロフィールにも同じように効く。会社ごとに変えたいものは
全部 `brand/brand.json` に寄せてあり、テンプレートにはブランド固有の値を書かない。

## ディレクトリ

| パス | 役割 |
|---|---|
| `brand/brand.json` | 発行名義の設定（唯一の会社固有ファイル）。スキーマは `brand/brand.schema.json` |
| `brand/<logo>` | ロゴ実体。`brand.json` の `logo.file` で指す |
| `brand/presets/` | 出発点にできる設定例。`npm run setup -- --preset aom` で複製 |
| `.mcp.json` | Prime 向け MCP の接続先（`setup` が書く。会社で共通なので commit してよい） |
| `local.config.json` | 端末ごとの設定。いまは `deliverDir`（PDF の保存先）だけ。git 管理外 |
| `talents/<slug>/talent.json` | タレント1人分の中身。スキーマは `template/talent.schema.json` |
| `talents/<slug>/<写真>` | 顔写真。`talent.json` 以外は git 管理外（`.gitignore` の `talents/*/*`） |
| `template/profile.njk` | Nunjucksテンプレート。ページ→セクションの順に組む |
| `template/sections/*.njk` | セクション単位の部品（hero / facts / overview / fit / points / coverage / career / skills / projects / cta） |
| `template/styles.css` | 組版の基本。ブランド色はCSS変数で受ける |
| `template/themes/*.css` | 色と面の使い方の差分（letterhead が既定。panel / classic / rule / mono） |
| `scripts/` | CLI群（下記） |
| `out/<slug>/` | 生成物（git管理外） |
| `preview/_example/` | サンプル `_example` の描画結果（PNG と render.json だけ追跡。CIが更新する） |

slug は `英数字 _ - .` だけ（`..` を含まない）。`_` で始まる slug はサンプル・作業用の扱いで、`--all` の対象から外れる。

## CLI

すべて `npm run <name> -- <args>` で呼ぶ。

| コマンド | 実体 | やること |
|---|---|---|
| `setup` | `scripts/setup-brand.mjs` | 対話でブランド名・会社名・キーカラー・ロゴ・写真の扱いを聞き、`brand/brand.json` を書き、プレビューを描く。`--preset <name>` で `brand/presets/<name>.json` を土台にする。preset 指定が無く既存の `brand.json` があれば**それを土台にして名義・色・ロゴだけ置き換える**（手で直した `labels` / `defaults` は残る）。`--non-interactive --name .. --company .. --accent .. [--logo path] [--hide-photo] [--deliver-dir path] [--mcp-url url|tenant] [--no-preview]` でも動く。ロゴは svg / png / jpg / webp のみ受け付け、`brand/` にコピーする。PDF の保存先は `local.config.json` に、MCP の接続先は `.mcp.json` に書く |
| `render` | `scripts/render.mjs` | `<slug>...` または `--all`（`_` `.` 始まりを除く全フォルダ）。`out/<slug>/profile.html` `profile.pdf` `p-N.png` `render.json` を作り、仕上がった PDF を保存先に `タレントプロフィール_<INITIALS>_ブラインド版.pdf` として複製する。`--brand <file>` で別のブランド設定、`--theme <name>` で見た目の切り替え（brand.json の theme より優先）、`--out <dir>` で作業出力先の変更、`--deliver <dir>` で今回だけ保存先を変更、`--no-deliver` で保存しない、`--no-png` でPNG省略、`--scale 1.5` でPNG解像度、`--allow-overflow` ではみ出しがあっても終了コード0 |
| `preview` | `render.mjs _example --out preview` | ブランド反映の確認用。`preview/_example/` に出る |
| `photo` | `scripts/photo.mjs` | `<slug> <url>`（http/https のみ・20MBまで）で写真を `talents/<slug>/photo.<ext>` に保存し、`talent.json` の `photo` を埋める |
| `check` | `scripts/check.mjs` | スキーマ検証、個人情報らしき文字列の検出、写真ファイルの存在確認、ブランド未設定の警告。`[slug...]` 省略時は全件。`--brand-only` で brand.json だけ |

終了コード: 0=成功 / 1=入力エラー（スキーマ・ファイル欠落・不正な slug・個人情報の検出） / 2=はみ出しあり（`--allow-overflow` で0にできる）。
複数 slug を渡したときは、入力エラーが1件でもあれば 1、無ければはみ出しがあれば 2。

`check` は、メールアドレス・電話番号・SNS やポートフォリオの URL（x.com / linkedin.com / github.com / note.com 等）を
本文で見つけるとエラーにする。`_note` の中と `@ハンドル` らしき文字列は警告に留める。

### PDF の保存先

優先順位は `--deliver` > 環境変数 `PTP_DELIVER_DIR` > `local.config.json` の `deliverDir` > デスクトップ（`~/Desktop`）。
`_` 始まりの slug（サンプル・作業用）、はみ出しのある版、CI（環境変数 `CI` あり）、`--no-deliver` のときは配らない。
同名ファイルは上書きする（古い版を残さない）。`render.json` の `delivered` に置いた先が入る。

## テンプレートが受け取るコンテキスト

`render.mjs` が `brand` と `talent` を解決してから Nunjucks に渡す。テンプレート側では
既定値の補完や色の計算をしない（全部スクリプト側でやる）。

```js
{
  css: "<template/styles.css の中身>",
  brand: {
    brandName, companyName,
    logoHtml,          // '<img class="logo-img" src="data:...">' / null
    logoHeight,        // "7mm"
    colors: { accent, accentDark, accentText, tint, ink, body, muted, hairline, paper },
    labels: { docType, docTitle, confidential, blindNote, ctaLead, ctaBody, footer },
    typography: { webFonts: true },
    theme: "letterhead",   // body の class になる。template/themes/<theme>.css が基本CSSに足される
    defaults: { ... }  // talent.mjs が既定値の解決に使う。テンプレートは参照しない
  },
  talent: {
    slug, initials, role, issued,
    availability: { key: "available", label: "稼働可能" },
    photoSrc,          // data URI / null
    facts: [ { k: "稼働目安", v: "月 40h〜", note: "増減ご相談可" }, ... ],   // 6件固定・この順
    overviewHtml: [ "<b>..</b> を含むHTML文字列", ... ],
    fitHtml: [ "課題1", "課題2", "課題3" ],               // talent.fit が無ければ []
    pointsHtml: [ "<b>..</b> を含むHTML文字列", ... ],     // talent.points が無ければ []
    coverage: [ { label: "役割", items: [...] }, ... ],   // items が空の行は含めない（全部空なら []）
    career: [ { period, org, title, note, headline, body } ],
    skills: [ { group, level, items } ],
    projects: [ { name, badge, subtitle, body, tools, featured } ],
    warnings: [ "写真 photo.jpg が見つかりません（イニシャル枠で出力します）" ]   // テンプレートは参照しない
  },
  pages: [ ["hero","facts","overview","coverage"], ["career","skills"], ["projects","cta"] ],
  meta: { year: 2026, total: 3, generatedAt: "2026-09-03T02:00:00.000Z" }
}
```

### 解決ルール

- `colors`: `accentDark` 省略時は accent を18%暗くする。`tint` 省略時は accent 8% + paper 92%。
  `accentText` は指定があればそれ、無ければ accent を紙とのコントラスト比が 4.5 を超えるまで暗くしたもの
  （明るいキーカラーを文字に使うと読めないため。罫線・タグの枠・代表プロジェクトの左罫線・CTA の上罫線には accent をそのまま使う）。
  `ink/body/muted/hairline/paper` の既定は `#1A1A1A / #3C3C3C / #8A8A8A / #D9D9D9 / #FFFFFF`。
- `logoHtml`: SVG も PNG/JPG/WebP も **data URI の `<img>`** にする。SVG をインラインで埋め込まないのは、ロゴ内の
  `<style>` が資料全体に効いたり `<script>` が走ったりするのを防ぐため（Illustrator 書き出しの SVG は `<style>` を含むことが多い）。
  SVG は XML 宣言・コメント・`width`/`height` 属性を除き、`viewBox` が無ければ補う。`logo.color` が `accent` / `ink` のときは
  SVG 中の `currentColor` を `accentText` / `ink` の HEX に置換してから埋め込む（`original` は無加工）。`logo` が null なら null。
- `facts`: 順序は 稼働目安 / 参考単価 / 稼働開始 / 契約形態 / 勤務スタイル / 希望領域。
  talent 側が null のセルは `brand.defaults` で埋める。参考単価の既定は「15,000円/h〜」（注記「手数料込」）で、
  `brand.defaults.rate` を null にすると「別途ご案内」、
  稼働目安は null なら「応相談」、希望領域は null なら「ご面談時にご相談」。
- `photoSrc`: `talent.photo` のファイルがあり、拡張子が jpg/jpeg/png/webp/svg で、かつ `brand.defaults.hidePhoto` が false のときだけ data URI。
  `photo` を指定しているのにファイルが無い・形式が違うときは `warnings` に入れて（無言で落とさない）イニシャル枠にする。
- `overviewHtml`: HTMLエスケープ後に `**x**` → `<b>x</b>`、改行 → `<br>`。
- `pages`: `talent.layout.pages` があればそれ。無ければ projects が1件以上で3ページ、0件なら
  `[["hero","facts","overview","coverage"],["career","skills","cta"]]` の2ページ。
  `fit` か `points` が1件以上ある提案型は、1ページ目を `hero, facts, overview, skills`、2ページ目を `fit, points, career`、
  3ページ目を `coverage, projects, cta` にする（projects が無ければ3ページ目は `coverage, cta`）。
  5節以上を載せるページにはテンプレートが `dense` クラスを付け、縦の間隔を少し詰める（本文の大きさは変えない）。
- `issued` 省略時は生成日の `YYYY.MM`（JST）。`meta.year` は `issued` の年（現状テンプレートは `meta.total` だけ使う）。

## はみ出し検知

各 `.page` は A4 固定高さで、本文域 `.body` はフッターの上までの高さに収まるよう縮む。描画後に `.page` と `.body` の
それぞれで `scrollHeight - clientHeight` を測り、大きい方が正なら超過量を mm に換算して報告する
（`.page` だけを見ると、本文がフッターや下余白に食い込んだ場合を見逃す）。PDFは作るが終了コードは2にする。
直し方は文章を削ること（フォントや余白は触らない。`docs/design.md`）。
横方向のはみ出しは検知しない。長い肩書きは2ページ目以降のヘッダーで末尾を省略する。

## CI

- `preview.yml`: `brand/` `template/` `scripts/` `talents/_example/` の変更で走り、`_example` を描いて
  `preview/_example/` の PNG と render.json を commit する（`--allow-overflow` 付き。崩れていても画像が更新されるほうが気づける）。
  README がこの画像を参照しているので、設定を変えて push すれば数分後にREADME上で見え方が確認できる。
- `render.yml`: 手動実行（slug指定）または `talents/**` の push で走り、PDFを Artifacts に置く（14日保持）。
  手動実行の入力は環境変数経由でシェルに渡す（`${{ }}` の直接展開はしない）。
  写真は git 管理外なので、CI で描いた PDF はイニシャルの枠になる。納品物はローカルで描く。

Linux ランナーには日本語フォントが無いので `fonts-noto-cjk` を入れる。`typography.webFonts` が true なら
Google Fonts を使うため環境差は出ないが、オフライン時の保険として入れておく。
Actions の書き込み権限が組織で read-only に固定されていると `preview.yml` の push が失敗する。その場合はリポジトリの
Settings → Actions → Workflow permissions を Read and write にする。
