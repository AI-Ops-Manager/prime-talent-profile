# セットアップ手順書の作り方

`docs/setup-manual.pdf` は `build.mjs` が作る。GitHub の画面イメージ・ターミナルの画面を HTML で描き、
Skitch 風の注釈（枠・番号・矢印）を重ねて A4 の PDF に組む。

```bash
# デモのブランド設定でサンプルを描いてから、手順書を組む
node scripts/render.mjs _example --brand docs/manual-src/brand-demo.json --out out/manual/demo --no-deliver
node docs/manual-src/build.mjs
cp "out/manual/セットアップ手順書_prime-talent-profile.pdf" docs/setup-manual.pdf
```

画面イメージは実際の GitHub とは細部が異なる（ログアウト状態では「Use this template」が撮れないため）。
