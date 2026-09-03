// セットアップ手順書（Skitch風の注釈付きスクリーンショット → A4 PDF）を組み立てる
// 注釈の座標は画面イメージの要素（data-a 属性）を実測して決める
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DIR = path.join(ROOT, "out/manual"); fs.mkdirSync(DIR, { recursive: true });
const IMG = path.join(DIR, "img");
fs.mkdirSync(IMG, { recursive: true });
const FONT = `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
const MONO = `"SF Mono", Menlo, Monaco, "Courier New", monospace`;
const b64 = (p) => fs.readFileSync(p).toString("base64");
const dataUri = (p, mime) => `data:${mime};base64,${b64(p)}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// HTML を撮影し、data-a 付き要素の位置（CSS px）を返す
async function shot(html, w, h, file, scale = 2) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const anchors = await page.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll("[data-a]")) {
      const r = el.getBoundingClientRect();
      out[el.dataset.a] = { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    }
    return out;
  });
  await page.screenshot({ path: path.join(IMG, file), clip: { x: 0, y: 0, width: w, height: h } });
  return anchors;
}

// ---------- 画面イメージ: GitHub のリポジトリ画面 ----------
const ghCss = `body{margin:0;font-family:-apple-system,"Segoe UI",${FONT};background:#fff;color:#1f2328;width:1100px}
.top{height:56px;background:#24292f;display:flex;align-items:center;padding:0 24px;color:#fff;gap:18px;font-size:15px}
.top .mark{width:30px;height:30px;border-radius:50%;background:#fff}
.wrap{padding:18px 28px}
.title{display:flex;align-items:center;gap:10px;font-size:22px;color:#0969da}
.title b{color:#0969da;font-weight:600}.title .sep{color:#57606a}
.pill{border:1px solid #d0d7de;border-radius:999px;padding:2px 10px;font-size:12px;color:#57606a;margin-left:6px}
.tabs{display:flex;gap:26px;margin-top:20px;border-bottom:1px solid #d0d7de;font-size:15px;color:#1f2328}
.tabs span{padding:10px 4px 12px}.tabs .on{border-bottom:2px solid #fd8c73;font-weight:600}
.bar{display:flex;align-items:center;margin-top:18px;gap:12px}
.btn{border:1px solid #d0d7de;border-radius:6px;padding:8px 14px;font-size:14px;background:#f6f8fa;font-weight:500}
.btn.g{background:#1f883d;color:#fff;border-color:#1f883d;font-weight:600}
.spacer{flex:1}
.file{border:1px solid #d0d7de;border-radius:6px;margin-top:16px;overflow:hidden}
.file div{padding:12px 16px;border-top:1px solid #d0d7de;font-size:14px;color:#57606a;display:flex;gap:14px}
.file div:first-child{border-top:none;background:#f6f8fa;color:#1f2328}
.menu{position:absolute;right:130px;top:236px;width:250px;background:#fff;border:1px solid #d0d7de;border-radius:8px;box-shadow:0 8px 24px rgba(140,149,159,.3);padding:8px;font-size:14px}
.menu div{padding:8px 10px;border-radius:6px}.menu .hi{background:#f6f8fa;font-weight:600}
.menu small{display:block;color:#57606a;font-weight:400;font-size:12px}
.note{position:absolute;right:16px;bottom:8px;font-size:11px;color:#8c959f}`;

const ghHeader = `<html><head><meta charset="utf-8"><style>${ghCss}</style></head><body>
<div class="top"><div class="mark"></div><span>Product</span><span>Solutions</span><span>Resources</span><span>Pricing</span></div>
<div class="wrap">
  <div class="title"><span>AI-Ops-Manager</span><span class="sep">/</span><b>prime-talent-profile</b><span class="pill">Private template</span></div>
  <div class="tabs"><span class="on">Code</span><span>Issues</span><span>Pull requests</span><span>Actions</span><span>Settings</span></div>
  <div class="bar"><span class="btn">main ▾</span><span class="btn" style="background:#fff;color:#57606a;width:220px">Go to file</span><span class="spacer"></span><span class="btn g" data-a="tpl" style="width:170px;text-align:center">Use this template ▾</span><span class="btn g" style="background:#0969da;border-color:#0969da">Code ▾</span></div>
  <div class="file"><div>README.md を更新</div><div>.claude/</div><div>brand/</div><div>docs/</div><div>scripts/</div></div>
</div>
<div class="menu"><div class="hi" data-a="menu">Create a new repository<small>テンプレートから自社用のリポジトリを作る</small></div><div>Open in a codespace</div></div>
<div class="note">画面イメージ（実際の GitHub の画面とは細部が異なります）</div>
</body></html>`;
const ghA = await shot(ghHeader, 1100, 430, "gh-header.png");

const ghForm = `<html><head><meta charset="utf-8"><style>${ghCss}
.form{padding:32px 48px;width:1100px}
h1{font-size:24px;font-weight:600;margin:0 0 6px}.sub{color:#57606a;font-size:14px;margin-bottom:28px}
label{display:block;font-size:14px;font-weight:600;margin-bottom:6px}
.row{display:flex;align-items:flex-end;gap:14px}
.sel,.inp{border:1px solid #d0d7de;border-radius:6px;padding:9px 12px;font-size:15px;background:#f6f8fa;height:44px;box-sizing:border-box;display:flex;align-items:center}
.inp{background:#fff}
.slash{font-size:24px;color:#57606a;padding-bottom:6px}
.radio{display:flex;gap:12px;align-items:flex-start;margin-top:14px;font-size:15px;width:520px}
.radio .dot{width:18px;height:18px;border-radius:50%;border:1px solid #8c959f;margin-top:3px;flex:none}
.radio .dot.on{border:6px solid #0969da;box-sizing:border-box}
.radio small{display:block;color:#57606a;font-size:13px}
.hr{border-top:1px solid #d0d7de;margin:26px 0}
</style></head><body>
<div class="form">
  <h1>Create a new repository</h1>
  <div class="sub">Repository template: <b>AI-Ops-Manager/prime-talent-profile</b></div>
  <div class="row">
    <div><label>Owner *</label><div class="sel" data-a="owner" style="width:260px">your-company ▾</div></div>
    <div class="slash">/</div>
    <div><label>Repository name *</label><div class="inp" data-a="name" style="width:400px">prime-talent-profile</div></div>
  </div>
  <div style="margin-top:22px"><label>Description (optional)</label><div class="inp" style="width:700px;color:#8c959f">タレント紹介資料の作成キット</div></div>
  <div class="hr"></div>
  <div class="radio"><div class="dot"></div><div><b>Public</b><small>Anyone on the internet can see this repository.</small></div></div>
  <div class="radio" data-a="private"><div class="dot on"></div><div><b>Private</b><small>You choose who can see and commit to this repository.</small></div></div>
  <div class="hr"></div>
  <span class="btn g" data-a="create" style="display:inline-block;padding:10px 20px">Create repository</span>
</div>
<div class="note">画面イメージ（実際の GitHub の画面とは細部が異なります）</div>
</body></html>`;
const formA = await shot(ghForm, 1100, 560, "gh-form.png");

// ---------- ターミナルの画面 ----------
function terminal(lines, h) {
  const rows = lines.map(([k, t], i) => `<div class="${k}" data-a="l${i}">${esc(t)}</div>`).join("");
  return `<html><head><meta charset="utf-8"><style>
  body{margin:0;width:1100px;background:#e9e9ec;font-family:${MONO}}
  .win{position:absolute;left:0;top:0;width:1100px;height:${h}px;background:#1e1f24;border-radius:10px;overflow:hidden}
  .bar{height:38px;background:#2b2c31;display:flex;align-items:center;padding:0 14px;gap:8px}
  .bar i{width:12px;height:12px;border-radius:50%;display:inline-block}.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
  .bar span{margin-left:auto;margin-right:auto;color:#9a9ca3;font-size:13px;font-family:${FONT}}
  .body{padding:14px 22px;font-size:15px;line-height:30px;color:#c8cad0;white-space:pre}
  .body div{width:max-content}
  .cmd{color:#fff}.cmd::before{content:"$ ";color:#5ac8fa}
  .out{color:#a0a3ab}.q{color:#7dd3fc}.ok{color:#8be28b}
  </style></head><body><div class="win"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>ターミナル</span></div><div class="body">${rows}</div></div></body></html>`;
}
const cloneA = await shot(terminal([
  ["cmd", "gh repo clone your-company/prime-talent-profile"],
  ["out", "Cloning into 'prime-talent-profile'..."],
  ["out", "Receiving objects: 100% (54/54), done."],
  ["cmd", "cd prime-talent-profile"],
  ["cmd", "node -v"],
  ["out", "v22.12.0"],
  ["cmd", "npm install"],
  ["out", "Chrome (150.0.7871.24) downloaded to ~/.cache/puppeteer/chrome/..."],
  ["ok", "added 128 packages in 42s"],
], 340), 1100, 340, "term-clone.png");
const setupA = await shot(terminal([
  ["cmd", "npm run setup"],
  ["q", "brand/brand.json は既に存在します。上書きしますか（y/N）: y"],
  ["q", "ブランド名（既定: YOUR BRAND）: Sample AI Partner"],
  ["q", "会社名（既定: （会社名を設定してください））: 株式会社サンプル"],
  ["q", "キーカラー（HEX）（既定: #555555）: #1F3A5F"],
  ["q", "ロゴファイルのパス（空でスキップ）: ~/Downloads/logo.svg"],
  ["q", "写真を伏せますか（y/N）（既定: N）: "],
  ["q", "PDF の保存先フォルダ（空ならデスクトップ）: "],
  ["q", "Prime 向け MCP の URL またはテナント名（AOMから案内。空でスキップ）: sample"],
  ["ok", "brand/brand.json を書き込みました"],
  ["ok", ".mcp.json に Prime 向け MCP を書きました: https://sample.prime.ai-ops-manager.com/mcp"],
  ["out", "検証OK: brand/brand.json"],
  ["out", "プレビューを生成します..."],
  ["ok", "[_example] .../preview/_example/profile.pdf を生成しました（3ページ, 1083588 bytes）"],
], 500), 1100, 500, "term-setup.png");
const renderA = await shot(terminal([
  ["cmd", "mkdir talents/kk"],
  ["cmd", "cp talents/_example/talent.json talents/kk/talent.json"],
  ["out", "（talents/kk/talent.json を書き換える。写真は talents/kk/photo.jpg に置く）"],
  ["cmd", "npm run check -- kk"],
  ["out", "検証OK: brand/brand.json, talents(1件): kk"],
  ["cmd", "npm run render -- kk"],
  ["ok", "[kk] .../out/kk/profile.pdf を生成しました（3ページ, 1247051 bytes）"],
  ["ok", "[kk] 保存: /Users/you/Desktop/タレントプロフィール_K.K._ブラインド版.pdf"],
], 320), 1100, 320, "term-render.png");

// 出来上がりのプレビュー（デモのブランド設定）を上半分だけ切り出す（620×470）
{
  const src = dataUri(path.join(DIR, "demo/_example/p-1.png"), "image/png");
  await shot(`<html><head><style>body{margin:0;width:620px;height:470px;overflow:hidden}img{width:620px;display:block}</style></head><body><img src="${src}"></body></html>`, 620, 470, "demo-p1-top.png");
}

// ---------- Skitch 風の注釈 ----------
const PAD = 6;
const boxOf = (a, pad = PAD) => ({ t: "box", x: a.x - pad, y: a.y - pad, w: a.w + pad * 2, h: a.h + pad * 2 });
const badgeAt = (n, a, dx = -PAD, dy = -PAD) => ({ t: "badge", n, x: a.x + dx, y: a.y + dy });
const badgeRight = (n, a, x = 1050) => ({ t: "badge", n, x, y: a.cy, small: true });
const labelLeft = (a, v, gap = 40, s = 22) => [
  { t: "text", x: a.x - gap - 12, y: a.cy + 8, v, s, anchor: "end" },
  { t: "arrow", x1: a.x - gap, y1: a.cy, x2: a.x - PAD - 4, y2: a.cy },
];
const labelRight = (a, v, gap = 40, s = 22) => [
  { t: "text", x: a.x + a.w + gap + 12, y: a.cy + 8, v, s },
  { t: "arrow", x1: a.x + a.w + gap, y1: a.cy, x2: a.x + a.w + PAD + 4, y2: a.cy },
];

function annotate(imgFile, w, h, items, outFile) {
  const src = dataUri(path.join(IMG, imgFile), "image/png");
  const svg = items.flat().map((a) => {
    if (a.t === "box") return `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="10" fill="none" stroke="#FF2D55" stroke-width="5" filter="url(#sh)"/>`;
    if (a.t === "badge") { const r = a.small ? 15 : 21, fs = a.small ? 18 : 25, dy = a.small ? 6 : 9; return `<g filter="url(#sh)"><circle cx="${a.x}" cy="${a.y}" r="${r}" fill="#FF2D55" stroke="#fff" stroke-width="3"/><text x="${a.x}" y="${a.y + dy}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" font-family="Helvetica Neue,Arial">${a.n}</text></g>`; }
    if (a.t === "arrow") {
      const cx = a.cx ?? (a.x1 + a.x2) / 2, cy = a.cy ?? (a.y1 + a.y2) / 2;
      const d = `M${a.x1},${a.y1} Q${cx},${cy} ${a.x2},${a.y2}`;
      return `<g filter="url(#sh)"><path d="${d}" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#FF2D55" stroke-width="6" stroke-linecap="round" marker-end="url(#head)"/></g>`;
    }
    if (a.t === "text") return `<text x="${a.x}" y="${a.y}" text-anchor="${a.anchor ?? "start"}" font-size="${a.s ?? 22}" font-weight="800" fill="#FF2D55" stroke="#fff" stroke-width="7" paint-order="stroke" stroke-linejoin="round" font-family='${FONT}'>${a.v}</text>`;
    return "";
  }).join("");
  const html = `<html><head><meta charset="utf-8"><style>body{margin:0;width:${w}px;height:${h}px;position:relative;background:#fff}img{position:absolute;left:0;top:0;width:${w}px;height:${h}px}svg{position:absolute;left:0;top:0}</style></head><body><img src="${src}"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/></filter><marker id="head" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#FF2D55"/></marker></defs>${svg}</svg></body></html>`;
  return shot(html, w, h, outFile);
}

await annotate("gh-header.png", 1100, 430, [
  boxOf(ghA.tpl), badgeAt(1, ghA.tpl), labelLeft(ghA.tpl, "「Use this template」を押す"),
  boxOf(ghA.menu), badgeAt(2, ghA.menu), labelLeft(ghA.menu, "「Create a new repository」を選ぶ"),
], "gh-header-a.png");
await annotate("gh-form.png", 1100, 560, [
  boxOf(formA.owner), badgeAt(1, formA.owner),
  boxOf(formA.name), badgeAt(2, formA.name), labelRight(formA.name, "名前は自由"),
  boxOf(formA.private), badgeAt(3, formA.private), labelRight(formA.private, "Private を選ぶ"),
  boxOf(formA.create), badgeAt(4, formA.create), labelRight(formA.create, "作成する"),
], "gh-form-a.png");
await annotate("term-clone.png", 1100, 340, [
  boxOf(cloneA.l0), badgeRight(1, cloneA.l0),
  boxOf(cloneA.l4), badgeRight(2, cloneA.l4), { t: "text", x: cloneA.l5.x + cloneA.l5.w + 40, y: cloneA.l5.cy + 8, v: "22.12 以上であること", s: 20 },
  boxOf(cloneA.l6), badgeRight(3, cloneA.l6),
], "term-clone-a.png");
await annotate("term-setup.png", 1100, 500, [
  badgeRight(1, setupA.l2), badgeRight(2, setupA.l3), badgeRight(3, setupA.l4), badgeRight(4, setupA.l5),
  badgeRight(5, setupA.l7), badgeRight(6, setupA.l8),
  boxOf(setupA.l13), { t: "text", x: 540, y: setupA.l12.cy + 8, v: "サンプルが描かれ、見え方を確認できる", s: 20 },
], "term-setup-a.png");
await annotate("term-render.png", 1100, 320, [
  { t: "box", x: renderA.l0.x - PAD, y: renderA.l0.y - PAD, w: Math.max(renderA.l0.w, renderA.l1.w) + PAD * 2, h: renderA.l1.y + renderA.l1.h - renderA.l0.y + PAD * 2 }, badgeRight(1, renderA.l0),
  boxOf(renderA.l3), badgeRight(2, renderA.l3),
  boxOf(renderA.l5), badgeRight(3, renderA.l5),
  boxOf(renderA.l7), { t: "text", x: renderA.l7.x + renderA.l7.w + 30, y: renderA.l7.cy + 8, v: "デスクトップに置かれる", s: 20 },
], "term-render-a.png");
// 出来上がり（上半分）: 座標は 1240px 幅の描画結果を 620px に縮めたもの
await annotate("demo-p1-top.png", 620, 470, [
  { t: "box", x: 0, y: 0, w: 620, h: 8 }, { t: "badge", n: 1, x: 596, y: 24 }, { t: "text", x: 566, y: 32, v: "上端の色帯 ＝ キーカラー", s: 16, anchor: "end" },
  { t: "box", x: 40, y: 36, w: 190, h: 32 }, { t: "badge", n: 2, x: 250, y: 52 }, { t: "text", x: 278, y: 60, v: "ロゴ（無ければブランド名）", s: 16 },
  { t: "box", x: 40, y: 246, w: 540, h: 128 }, { t: "badge", n: 3, x: 596, y: 250 }, { t: "text", x: 300, y: 238, v: "参考単価などの既定値", s: 16 },
], "demo-p1-top-a.png");

// ---------- 手順書本体（A4） ----------
const logo = dataUri(path.join(ROOT, "brand/presets/aom-logo.svg"), "image/svg+xml");
const img = (f) => dataUri(path.join(IMG, f), "image/png");
const css = `
@page{size:A4;margin:0} *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:${FONT};color:#1a1a1a;font-feature-settings:"palt"}
.page{width:210mm;height:296mm;padding:16mm 16mm 18mm;position:relative;overflow:hidden;break-after:page;background:#fff}
.page:last-child{break-after:auto}
.page::before{content:"";position:absolute;left:0;top:0;right:0;height:1.6mm;background:#0000D4}
.head{display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;color:#8a8a8a;border-bottom:.25mm solid #ddd;padding-bottom:3mm;margin-bottom:8mm;letter-spacing:.04em}
.head img{height:6mm}
.foot{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;font-size:8pt;color:#8a8a8a}
h1{font-size:26pt;font-weight:700;line-height:1.35;letter-spacing:.02em}
h2{font-size:15pt;font-weight:700;border-bottom:.4mm solid #1a1a1a;padding-bottom:1.8mm;margin-bottom:5mm;letter-spacing:.06em}
h2 .step{display:inline-block;background:#1a1a1a;color:#fff;font-size:9pt;padding:.4mm 2.4mm;border-radius:.6mm;margin-right:3mm;vertical-align:.25em;letter-spacing:.1em}
h3{font-size:11.5pt;font-weight:700;margin:5mm 0 2mm}
p,li{font-size:10.5pt;line-height:1.8;color:#333}
ul,ol{padding-left:5.5mm;margin:1mm 0 3mm}
li{margin-bottom:.8mm}
.lead{font-size:12pt;line-height:1.9;color:#333}
.shot{width:100%;border:.25mm solid #ddd;border-radius:1mm;display:block;margin:3mm 0 2mm}
.cap{font-size:8.5pt;color:#8a8a8a;margin-bottom:5mm;line-height:1.6}
.cmd{font-family:${MONO};font-size:10pt;background:#f4f4f6;border-radius:1mm;padding:3mm 4mm;margin:2mm 0 4mm;white-space:pre;line-height:1.7}
.inl{font-family:${MONO};font-size:9.5pt;background:#f4f4f6;border-radius:.6mm;padding:.3mm 1.5mm}
.note{border-left:.8mm solid #0000D4;background:#f6f6f8;padding:3mm 4mm;margin:3mm 0;font-size:10pt;line-height:1.75;color:#333}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:6mm 0}
.card{border:.25mm solid #ddd;border-radius:1mm;padding:4mm}
.card .n{font-family:Helvetica Neue,Arial;font-size:22pt;font-weight:700;color:#0000D4;line-height:1}
.card b{display:block;font-size:11pt;margin:2mm 0 1.5mm}
.card p{font-size:9pt;line-height:1.6;color:#555}
table{border-collapse:collapse;width:100%;font-size:10pt;margin:2mm 0 4mm}
th,td{border-bottom:.25mm solid #ddd;padding:2.2mm 2mm;text-align:left;vertical-align:top;line-height:1.6}
th{font-weight:700;background:#f4f4f6}
.cover{padding-top:40mm}
.cover .kicker{font-size:11pt;letter-spacing:.2em;color:#0000D4;font-weight:700;margin-bottom:6mm}
.cover .sub{font-size:13pt;color:#555;margin-top:6mm;line-height:1.8;max-width:150mm}
.cover .meta{position:absolute;left:16mm;bottom:22mm;font-size:10pt;color:#555;line-height:1.9}
.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm;align-items:start}
`;
const head = (t) => `<div class="head"><img src="${logo}"><span>${t}</span></div>`;
const foot = (n) => `<div class="foot"><span>AI Ops Manager株式会社 ｜ Prime パートナー向け</span><span>${n}</span></div>`;
const pages = [];
pages.push(`<section class="page cover">
  <img src="${logo}" style="height:9mm;margin-bottom:22mm">
  <div class="kicker">SETUP GUIDE</div>
  <h1>タレントプロフィール作成キット<br>セットアップ手順書</h1>
  <div class="sub">自社のロゴとキーカラーを一度設定すれば、タレント1名の紹介資料（ブラインド版・A4 3ページ）を同じ体裁で出せるようになります。所要時間の目安は30分です。</div>
  <div class="meta">対象: Prime パートナー各社のご担当者<br>リポジトリ: AI-Ops-Manager/prime-talent-profile（テンプレート）<br>2026.09 版</div>
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ 全体の流れ")}
  <h2>全体の流れ</h2>
  <p class="lead">やることは4つです。GitHub で自社用のリポジトリを作り、手元に取り込み、ロゴと色を設定し、タレントを追加して PDF を出します。</p>
  <div class="grid4">
    <div class="card"><div class="n">1</div><b>自社リポジトリを作る</b><p>GitHub でテンプレートから自社組織に複製する（5分）</p></div>
    <div class="card"><div class="n">2</div><b>手元に取り込む</b><p>clone して npm install（10分。Chrome のダウンロード込み）</p></div>
    <div class="card"><div class="n">3</div><b>ロゴと色を設定する</b><p>npm run setup に答えるだけ。サンプルで見え方を確認（10分）</p></div>
    <div class="card"><div class="n">4</div><b>タレントを追加して出す</b><p>talent.json を書いて npm run render。PDF はデスクトップへ（5分）</p></div>
  </div>
  <h3>用意するもの</h3>
  <table><tr><th style="width:38mm">もの</th><th>備考</th></tr>
  <tr><td>GitHub アカウント</td><td>AOM からテンプレートリポジトリへの招待メールが届きます。承認しておいてください。組織（Organization）で管理する場合は、その組織に作成権限のあるアカウントで進めます</td></tr>
  <tr><td>Node.js 22.12 以上</td><td>https://nodejs.org/ から LTS を入れます。<span class="inl">node -v</span> で確認できます</td></tr>
  <tr><td>gh コマンド（任意）</td><td>GitHub CLI。無ければ git clone で代用できます（STEP 2）</td></tr>
  <tr><td>Claude Code（任意）</td><td>タレントデータの取得から資料化までを対話で進めたい場合。無くても手作業で作れます（p.7）</td></tr>
  <tr><td>ロゴ画像</td><td>SVG が最もきれいに出ます。PNG なら背景透過・横幅 800px 以上</td></tr>
  </table>
  <div class="note">この手順書のコマンドは macOS のターミナルを前提にしています。Windows でも同じコマンドで動きます（PowerShell）。</div>
  ${foot("2")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 1")}
  <h2><span class="step">STEP 1</span>自社用のリポジトリを作る</h2>
  <p>AOM から共有されたテンプレートリポジトリを開き、自社の組織（またはアカウント）に複製します。テンプレートそのものを clone すると自社の設定を保存できないので、必ず複製してから進めます。</p>
  <img class="shot" src="${img("gh-header-a.png")}">
  <div class="cap">GitHub のリポジトリ画面。緑の「Use this template」から「Create a new repository」を選びます（画面イメージ）</div>
  <img class="shot" src="${img("gh-form-a.png")}">
  <div class="cap">① Owner に自社の組織を選ぶ　② リポジトリ名は自由　③ Private のまま　④ Create repository（画面イメージ）</div>
  <div class="note">複製したリポジトリは自社のものです。以降のロゴ・タレントデータはここに入り、AOM 側には共有されません。</div>
  ${foot("3")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 2")}
  <h2><span class="step">STEP 2</span>手元に取り込む</h2>
  <p>ターミナルを開き、複製したリポジトリを clone して依存関係を入れます。<b>your-company</b> の部分は自社の組織名（またはアカウント名）に読み替えてください。</p>
  <div class="cmd">gh repo clone your-company/prime-talent-profile
cd prime-talent-profile
npm install</div>
  <img class="shot" src="${img("term-clone-a.png")}">
  <div class="cap">① clone　② Node.js のバージョン確認（22.12 以上）　③ 依存関係の導入。PDF 描画用の Chrome（約170MB）もここで入ります</div>
  <h3>gh コマンドが無い場合</h3>
  <div class="cmd">git clone https://github.com/your-company/prime-talent-profile.git</div>
  <div class="note">npm install が Chrome のダウンロードで止まる場合は、社内プロキシの影響が考えられます。手元の Chrome を使う設定（環境変数 PUPPETEER_EXECUTABLE_PATH）に切り替えられます。README の「困ったとき」を参照してください。</div>
  ${foot("4")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 3")}
  <h2><span class="step">STEP 3</span>ロゴと色を設定する</h2>
  <p>質問に答えるだけで設定ファイル（brand/brand.json）が書かれ、サンプルの資料が描かれます。</p>
  <div class="cmd">npm run setup</div>
  <img class="shot" src="${img("term-setup-a.png")}">
  <div class="cap">① ブランド名（資料に出す名義）　② 会社名　③ キーカラー（HEX 1色）　④ ロゴのパス（空でも可）　⑤ PDF の保存先（空ならデスクトップ）　⑥ MCP の接続先（AOM から案内があれば）</div>
  <div class="two">
    <div>
      <h3>見え方を確認する</h3>
      <p>preview/_example/p-1.png を開きます。右の①〜③が自社の設定になっていれば完了です。フッターには会社名が入ります。あとから色だけ直したいときも同じコマンドで上書きできます（定型文や単価の既定値は残ります）。</p>
      <h3>設定を保存する</h3>
      <div class="cmd">git add -A
git commit -m "ブランド設定"
git push</div>
      <p>push すると GitHub 側でもサンプルが描き直され、リポジトリの README にプレビューが表示されます。</p>
    </div>
    <div><img class="shot" src="${img("demo-p1-top-a.png")}" style="margin-top:0"><div class="cap">サンプルの1ページ目（上半分）</div></div>
  </div>
  ${foot("5")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 4")}
  <h2><span class="step">STEP 4</span>タレントを追加して PDF を出す</h2>
  <p>タレント1名につき1フォルダです。フォルダ名はイニシャルの小文字（例: K.K. → kk）。サンプルを複製して中身を書き換えます。</p>
  <img class="shot" src="${img("term-render-a.png")}">
  <div class="cap">① フォルダを作ってサンプルを複製　② 書き終えたら check（実名やメールアドレスの混入を検出）　③ render で PDF と確認用の画像が出ます</div>
  <h3>talent.json に書くこと</h3>
  <table><tr><th style="width:34mm">項目</th><th>内容</th></tr>
  <tr><td>initials / role</td><td>イニシャルと肩書き（例: K.K. / Corporate Ops / AI Automation Lead）</td></tr>
  <tr><td>facts</td><td>稼働目安・稼働開始・勤務スタイル・希望領域。参考単価は既定の「15,000円/h〜」が入ります</td></tr>
  <tr><td>overview</td><td>概要。**太字** が使えます</td></tr>
  <tr><td>fit / points</td><td>解決できる課題（3点）と推薦理由（4点）。書くと2ページ目の先頭に入り、提案向けの構成になります</td></tr>
  <tr><td>career / skills / projects</td><td>経歴（3〜4件）・スキル（4分類）・実績（3〜5件）。projects で featured: true にしたものに「適合」のラベルが付きます</td></tr>
  <tr><td>photo</td><td>同じフォルダに置いた写真のファイル名。写真は git には入りません</td></tr>
  </table>
  <div class="note">分量が多いと「ページ N が X.Xmm はみ出しています」と出ます。文字を小さくするのではなく、文章を削って描き直してください。はみ出しがある版はデスクトップに置かれません。</div>
  ${foot("6")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ Claude Code で使う")}
  <h2>Claude Code で使う（任意）</h2>
  <p>Claude Code でこのリポジトリを開くと、タレントデータの取得から talent.json の作成、描画、確認までを対話で進められます。</p>
  <h3>1. AOM のタレントベースに接続する</h3>
  <p>STEP 3 で MCP の接続先を答えていれば、リポジトリ直下の .mcp.json に登録済みです。Claude Code を起動して <b>/mcp</b> を開き、<b>talent-hub-prime</b> を選ぶとブラウザでログイン画面が開きます。AOM から招待を受けたアカウントでログインしてください（人ごとに一度）。</p>
  <div class="cmd">claude
/mcp   → talent-hub-prime を選んでログイン</div>
  <h3>2. スキルを使う</h3>
  <table><tr><th style="width:36mm">スキル</th><th>頼み方の例</th></tr>
  <tr><td>/brand-setup</td><td>「ロゴと色を設定して」「キーカラーを #C8102E に変えて」</td></tr>
  <tr><td>/talent-pickup</td><td>「EC の受注業務を自動化できる人を探して。月20時間・リモート」</td></tr>
  <tr><td>/talent-profile</td><td>「候補の1人目でプロフィールを作って」「この人の資料を PDF にして」</td></tr>
  </table>
  <p>Claude は候補の絞り込みから資料の描画・目視確認まで進め、仕上がった PDF の場所を報告します。実名・連絡先・本人の面談予約リンクを資料に書かないルールはスキルに組み込まれています。</p>
  <div class="note">MCP から取れないもの（ランク・稼働不可のフラグ・面談の有無・他案件との掛け持ち）は AOM 側で管理しています。候補を先方に出す前に、AOM の担当へ稼働状況を確認してください。</div>
  ${foot("7")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ ルールと困ったとき")}
  <h2>資料に書いてはいけないこと</h2>
  <ul>
    <li>氏名（イニシャルだけ）、連絡先、SNS のアカウント、本人の面談予約リンク</li>
    <li>現職・自社の社名。「IPO準備企業」「マーケティング支援会社（社名はご面談時に開示）」のように業種で書く</li>
    <li>データベースに無い数字・実績。過去の在籍企業は、大手であれば実名で残してよい</li>
  </ul>
  <p>npm run check がメールアドレス・電話番号・SNS の URL を見つけるとエラーで止まります。実名や現職の社名は機械では見つけられないので、最後は人の目で確認してください。</p>
  <h2 style="margin-top:8mm">困ったとき</h2>
  <table><tr><th style="width:52mm">症状</th><th>対処</th></tr>
  <tr><td>日本語が豆腐（□）になる</td><td>Google Fonts を読みに行けない環境です。オフラインなら OS のフォントに落ちます。Windows は Noto Sans JP を入れると整います</td></tr>
  <tr><td>ロゴの色が変えられない</td><td>色を差し替えられるのは SVG で fill="currentColor" を使っているロゴだけです。それ以外はそのままの色で出ます</td></tr>
  <tr><td>PDF がデスクトップに無い</td><td>はみ出し警告が出た版は置かれません。文章を削って描き直してください。保存先は npm run setup で変えられます</td></tr>
  <tr><td>肩書きなどの色が薄い</td><td>明るいキーカラーは文字用に自動で暗くしています。それでも合わなければ brand.json の colors.accentText に文字用の色を書きます</td></tr>
  <tr><td>Chrome のダウンロードで止まる</td><td>プロキシ環境では PUPPETEER_DOWNLOAD_BASE_URL の設定が要ることがあります。手元の Chrome を使うなら PUPPETEER_EXECUTABLE_PATH にパスを入れます</td></tr>
  </table>
  <div class="note">キットの更新（テンプレートや描画スクリプトの改善）は AOM から案内します。自社リポジトリの brand/ と talents/ はそのままに、案内に沿って差分を取り込んでください。問い合わせ先: AOM の担当者まで。</div>
  ${foot("8")}
</section>`);
const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>${pages.join("")}</body></html>`;
fs.writeFileSync(path.join(DIR, "manual.html"), html);
await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.emulateMediaType("print");
const over = await page.evaluate(() => [...document.querySelectorAll(".page")].map((el, i) => ({ page: i + 1, over: el.scrollHeight - el.clientHeight })).filter((o) => o.over > 0));
console.log("overflow:", JSON.stringify(over));
const pdfPath = path.join(DIR, "セットアップ手順書_prime-talent-profile.pdf");
await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
const els = await page.$$(".page");
for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(DIR, `page-${i + 1}.png`) });
console.log("pdf:", pdfPath, fs.statSync(pdfPath).size, "bytes; pages:", els.length);
await browser.close();
