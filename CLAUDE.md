# prime-talent-profile — Claude Code への案内

タレント1名のブラインドプロフィール（A4縦PDF）を、このリポジトリを持つ会社の名義で作るためのキット。
ブランド設定は `brand/brand.json`、タレントの中身は `talents/<slug>/talent.json`、描画は `npm run render -- <slug>`。

## スキルの使い分け

| 依頼 | スキル |
|---|---|
| ロゴ・色を設定したい、色味を直したい | `.claude/skills/brand-setup` |
| 案件に合う候補を探したい、絞りたい | `.claude/skills/talent-pickup` |
| この人のプロフィールを作って、PDFにして | `.claude/skills/talent-profile` |

候補探しから資料までを一度に頼まれたら、pickup → profile の順に両方使う。

## 絶対に守ること

- **実名・連絡先・SNS・現職の社名を書かない。** データに入っていても `talent.json` に転記しない（`docs/design.md` と `talent-profile/references/blind-rules.md`）
- **数字と実績はデータにあるものだけ。** 「〜と思われる」で埋めない。無いものは書かない
- **写真ファイルを commit しない。** タレントのフォルダは `talent.json` 以外が `.gitignore` で除外されている。`git add -f` で入れない
- **ブランド以外の会社のロゴ・色を持ち込まない。** `brand/` 直下にあるのはこの会社のものだけ（`brand/presets/` は出発点の見本）
- **フォントサイズ・余白を小さくして分量を収めない。** 溢れたら文章を削る（`docs/design.md`）
- commit 前に `npm run check` を通す

## コマンド

```bash
npm run setup                      # ブランド設定（対話）
npm run render -- <slug>           # 1名を描く → out/<slug>/profile.pdf, p-N.png
npm run render -- --all            # 全員
npm run preview                    # サンプルで見え方を確認 → preview/
npm run photo -- <slug> <url>      # 写真を保存して talent.json に反映
npm run check                      # スキーマ検証と個人情報の簡易チェック
```

終了コード 2 は「はみ出しあり」。PDF はできているが、そのまま出さない。

## テンプレートを触るとき

`template/` の見た目は `docs/design.md` の方針に沿っている（白い紙・細い罫線・ブランド色は最小限）。
色コードを直書きしない（CSS変数で受ける）。ブランド固有の値をテンプレートに入れない。
直したら `npm run preview` で3ページとも目視する。
