// セットアップ手順書（1冊・Skitch風の注釈付きスクリーンショット → A4 PDF）を組み立てる
// 主ルートは「Claude Code に頼む」。各ステップに「自分でコマンドを打つ」を併記し、
// 自社 GitHub で共有する場合はセクションで分ける。
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DIR = path.join(ROOT, "out/manual");
const IMG = path.join(DIR, "img");
fs.mkdirSync(IMG, { recursive: true });
const REPO_URL = "https://github.com/AI-Ops-Manager/prime-talent-profile";
const FONT = `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
const MONO = `"SF Mono", Menlo, Monaco, "Courier New", monospace`;
const b64 = (p) => fs.readFileSync(p).toString("base64");
const dataUri = (p, mime) => `data:${mime};base64,${b64(p)}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

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

// ---------- 画面イメージ: GitHub ----------
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
  <div class="title"><span>AI-Ops-Manager</span><span class="sep">/</span><b>prime-talent-profile</b><span class="pill">Public template</span></div>
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

// ---------- 画面イメージ: 持ってきたフォルダの中身 ----------
const folderHtml = `<html><head><meta charset="utf-8"><style>
body{margin:0;width:1100px;font-family:${FONT};background:#f5f5f7}
.win{position:absolute;left:0;top:0;width:1100px;height:400px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 0 #ddd}
.bar{height:44px;background:#ececee;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid #d8d8dc}
.bar i{width:12px;height:12px;border-radius:50%;display:inline-block}.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
.bar span{margin-left:auto;margin-right:auto;color:#555;font-size:14px;font-weight:600}
.list{padding:10px 0}
.row{display:flex;align-items:center;gap:12px;padding:0 22px;height:34px;font-size:14px;color:#1d1d1f}
.row:nth-child(even){background:#f7f7f9}
.ic{width:18px;height:14px;border-radius:2px;background:#8ab4f8}
.ic.f{background:#e6e6ea;border:1px solid #cfcfd4;height:16px;width:13px}
.name{width:220px}.desc{color:#6e6e73;font-size:13px}
</style></head><body><div class="win"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>prime-talent-profile</span></div>
<div class="list">
<div class="row" data-a="brand"><span class="ic"></span><span class="name">brand</span><span class="desc">ロゴとキーカラーの設定（brand.json）。STEP 3 で書かれる</span></div>
<div class="row" data-a="talents"><span class="ic"></span><span class="name">talents</span><span class="desc">タレント1名につき1フォルダ。_example は架空のサンプル</span></div>
<div class="row" data-a="out"><span class="ic"></span><span class="name">out</span><span class="desc">描画したときにできる作業用の出力（PDF・確認用の画像）</span></div>
<div class="row"><span class="ic"></span><span class="name">docs</span><span class="desc">この手順書・設計の説明</span></div>
<div class="row"><span class="ic"></span><span class="name">scripts</span><span class="desc">描画・設定・検証のプログラム（触らない）</span></div>
<div class="row"><span class="ic"></span><span class="name">template</span><span class="desc">資料のひな形（触らない）</span></div>
<div class="row"><span class="ic f"></span><span class="name">README.md</span><span class="desc">使い方の全体</span></div>
<div class="row"><span class="ic f"></span><span class="name">package.json</span><span class="desc">npm のコマンド定義</span></div>
</div></div></body></html>`;
const folderA = await shot(folderHtml, 1100, 400, "folder.png");

// ---------- ターミナル／Claude Code の画面 ----------
function terminal(lines, h, title = "ターミナル") {
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
  .u{color:#fff}.u::before{content:"> ";color:#8a8f98}
  .tool{color:#d8b4fe}.tool::before{content:"⏺ ";color:#d8b4fe}
  .res{color:#a0a3ab}.res::before{content:"  ⎿  ";color:#6b7280}
  .say{color:#fff}.say::before{content:"⏺ ";color:#8be28b}
  .hd{color:#fff;font-weight:700}.sel{color:#fff}.sel::before{content:"❯ ";color:#5ac8fa}.dim{color:#8a8f98}
  .warn{color:#fbbf24}.good{color:#8be28b}
  </style></head><body><div class="win"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>${title}</span></div><div class="body">${rows}</div></div></body></html>`;
}
const cloneA = await shot(terminal([
  ["cmd", "cd ~/Documents"],
  ["cmd", `git clone ${REPO_URL}.git`],
  ["out", "Cloning into 'prime-talent-profile'..."],
  ["out", "Receiving objects: 100% (61/61), done."],
  ["cmd", "cd prime-talent-profile"],
  ["cmd", "node -v"],
  ["out", "v22.12.0"],
  ["cmd", "npm install"],
  ["out", "Chrome (150.0.7871.24) downloaded to ~/.cache/puppeteer/chrome/..."],
  ["ok", "added 128 packages in 42s"],
], 370), 1100, 370, "term-clone.png");
const setupA = await shot(terminal([
  ["cmd", "npm run setup"],
  ["q", "brand/brand.json は既に存在します。上書きしますか（y/N）: y"],
  ["q", "ブランド名（既定: YOUR BRAND）: Sample AI Partner"],
  ["q", "会社名（既定: （会社名を設定してください））: 株式会社サンプル"],
  ["q", "キーカラー（HEX）（既定: #555555）: #1F3A5F"],
  ["q", "ロゴファイルのパス（空でスキップ）: ~/Downloads/logo.svg"],
  ["q", "写真を伏せますか（y/N）（既定: N）: "],
  ["q", "PDF の保存先フォルダ（空ならデスクトップ）: "],
  ["q", "Prime 向け MCP の URL またはテナント名（AOMから案内。空でスキップ）: "],
  ["ok", "brand/brand.json を書き込みました"],
  ["ok", "[_example] .../preview/_example/profile.pdf を生成しました（3ページ, 1083588 bytes）"],
], 410), 1100, 410, "term-setup.png");
const mcpA = await shot(terminal([
  ["u", "/mcp"],
  ["hd", "Manage MCP servers"],
  ["sel", "1. talent-hub-prime    ✘ needs authentication"],
  ["dim", "  Enter で選ぶ"],
  ["hd", "talent-hub-prime MCP Server"],
  ["dim", "  URL: https://sample.prime.ai-ops-manager.com/mcp"],
  ["sel", "1. Authenticate"],
  ["dim", "  ブラウザが開くので、AOM から招待を受けたアカウントでログインする"],
  ["good", "✔ talent-hub-prime  connected · 2 tools（search_talents, get_talent）"],
], 340, "Claude Code"), 1100, 340, "cc-mcp.png");
const runA = await shot(terminal([
  ["u", "K.K. さんのブラインドプロフィールを作って PDF にして。希望領域はバックオフィス業務の AI 化。"],
  ["tool", "talent-hub-prime - get_talent (MCP)(id: \"3f2a…\")"],
  ["res", "1件取得（経歴5件・実績4件・スキル17件・写真あり）"],
  ["tool", "Write(talents/kk/talent.json)"],
  ["res", "概要・解決できる課題3点・推薦理由4点・経歴3件・実績3件を作成"],
  ["tool", "Bash(npm run check -- kk)"],
  ["res", "検証OK: brand/brand.json, talents(1件): kk"],
  ["tool", "Bash(npm run render -- kk)"],
  ["res", "[kk] 保存: /Users/you/Desktop/タレントプロフィール_K.K._ブラインド版.pdf"],
  ["tool", "Read(out/kk/p-1.png … p-3.png)"],
  ["res", "3ページを目視確認。氏名・連絡先・現職の社名は出ていない"],
  ["say", "できました。PDF はデスクトップに置きました。現職の社名は業種表現に置き換えています。"],
], 430, "Claude Code"), 1100, 430, "cc-run.png");
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
for (const n of [1, 2]) {
  const src = dataUri(path.join(DIR, `demo/_example/p-${n}.png`), "image/png");
  await shot(`<html><head><style>body{margin:0;width:620px;height:470px;overflow:hidden}img{width:620px;display:block}</style></head><body><img src="${src}"></body></html>`, 620, 470, `demo-p${n}-top.png`);
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
await annotate("folder.png", 1100, 400, [
  boxOf(folderA.brand, 3), badgeRight(1, folderA.brand),
  boxOf(folderA.talents, 3), badgeRight(2, folderA.talents),
  boxOf(folderA.out, 3), badgeRight(3, folderA.out),
], "folder-a.png");
await annotate("term-clone.png", 1100, 370, [
  boxOf(cloneA.l1), badgeRight(1, cloneA.l1),
  boxOf(cloneA.l5), badgeRight(2, cloneA.l5), { t: "text", x: cloneA.l6.x + cloneA.l6.w + 40, y: cloneA.l6.cy + 8, v: "22.12 以上であること", s: 20 },
  boxOf(cloneA.l7), badgeRight(3, cloneA.l7),
], "term-clone-a.png");
await annotate("term-setup.png", 1100, 410, [
  badgeRight(1, setupA.l2), badgeRight(2, setupA.l3), badgeRight(3, setupA.l4), badgeRight(4, setupA.l5),
  badgeRight(5, setupA.l7), { t: "text", x: setupA.l8.x + setupA.l8.w + 30, y: setupA.l8.cy + 8, v: "STEP 4 で使う。無ければ空のまま Enter", s: 20 },
  boxOf(setupA.l10), { t: "text", x: setupA.l10.x + setupA.l10.w + 30, y: setupA.l10.cy + 8, v: "サンプルが描かれる", s: 20 },
], "term-setup-a.png");
await annotate("cc-mcp.png", 1100, 340, [
  boxOf(mcpA.l0), badgeRight(1, mcpA.l0),
  boxOf(mcpA.l2), badgeRight(2, mcpA.l2),
  boxOf(mcpA.l6), badgeRight(3, mcpA.l6),
  boxOf(mcpA.l8), badgeRight(4, mcpA.l8),
], "cc-mcp-a.png");
await annotate("cc-run.png", 1100, 430, [
  boxOf(runA.l0), badgeRight(1, runA.l0),
  boxOf(runA.l1), badgeRight(2, runA.l1),
  boxOf(runA.l3), badgeRight(3, runA.l3),
  boxOf(runA.l7), badgeRight(4, runA.l7),
  boxOf(runA.l11), badgeRight(5, runA.l11),
], "cc-run-a.png");
await annotate("term-render.png", 1100, 320, [
  { t: "box", x: renderA.l0.x - PAD, y: renderA.l0.y - PAD, w: Math.max(renderA.l0.w, renderA.l1.w) + PAD * 2, h: renderA.l1.y + renderA.l1.h - renderA.l0.y + PAD * 2 }, badgeRight(1, renderA.l0),
  boxOf(renderA.l3), badgeRight(2, renderA.l3),
  boxOf(renderA.l5), badgeRight(3, renderA.l5),
  boxOf(renderA.l7), { t: "text", x: renderA.l7.x + renderA.l7.w + 30, y: renderA.l7.cy + 8, v: "デスクトップに置かれる", s: 20 },
], "term-render-a.png");
await annotate("demo-p1-top.png", 620, 470, [
  { t: "box", x: 0, y: 0, w: 620, h: 8 }, { t: "badge", n: 1, x: 596, y: 24 }, { t: "text", x: 566, y: 32, v: "上端の色帯 ＝ キーカラー", s: 16, anchor: "end" },
  { t: "box", x: 40, y: 36, w: 190, h: 32 }, { t: "badge", n: 2, x: 250, y: 52 }, { t: "text", x: 278, y: 60, v: "ロゴ（無ければブランド名）", s: 16 },
  { t: "box", x: 40, y: 246, w: 540, h: 128 }, { t: "badge", n: 3, x: 596, y: 250 }, { t: "text", x: 300, y: 238, v: "参考単価などの既定値", s: 16 },
], "demo-p1-top-a.png");
await annotate("demo-p2-top.png", 620, 470, [
  { t: "box", x: 40, y: 86, w: 540, h: 108 }, { t: "badge", n: 1, x: 596, y: 92 },
  { t: "box", x: 40, y: 258, w: 540, h: 196 }, { t: "badge", n: 2, x: 596, y: 264 },
], "demo-p2-top-a.png");

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
h2 .step.opt{background:#8a8a8a}
h3{font-size:11.5pt;font-weight:700;margin:5mm 0 2mm}
h3 .way{display:inline-block;font-size:8.5pt;padding:.3mm 2mm;border-radius:.6mm;margin-right:2mm;vertical-align:.2em;letter-spacing:.06em}
h3 .way.a{background:#0000D4;color:#fff}.way.b{background:#eee;color:#333}
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
.chat{border:.25mm solid #d6d6dc;border-radius:1.2mm;overflow:hidden;margin:2mm 0 4mm;font-size:10.5pt;line-height:1.7}
.chat .u,.chat .c{padding:2.6mm 4mm;display:grid;grid-template-columns:16mm 1fr;gap:3mm}
.chat .u{background:#fff}.chat .c{background:#f6f6f8;border-top:.25mm solid #e6e6ea}
.chat b{font-size:8.5pt;color:#8a8a8a;font-weight:600;padding-top:.6mm}
`;
const head = (t) => `<div class="head"><img src="${logo}"><span>${t}</span></div>`;
const foot = (n) => `<div class="foot"><span>AI Ops Manager株式会社 ｜ Prime パートナー向け</span><span>${n}</span></div>`;
const chat = (u, c) => `<div class="chat"><div class="u"><b>あなた</b><span>${u}</span></div>${c ? `<div class="c"><b>Claude</b><span>${c}</span></div>` : ""}</div>`;

const pages = [];
pages.push(`<section class="page cover">
  <img src="${logo}" style="height:9mm;margin-bottom:22mm">
  <div class="kicker">SETUP GUIDE</div>
  <h1>タレントプロフィール作成キット<br>セットアップ手順書</h1>
  <div class="sub">GitHub で公開しているキットを手元の PC に持ってきて、自社のロゴとキーカラーを設定し、AOM のタレントベースからデータを取って紹介資料（ブラインド版・A4 3ページ）を PDF で出すまで。Claude Code に頼む方法を主に、自分でコマンドを打つ方法も併記しています。所要時間の目安は40分です。</div>
  <div class="meta">対象: Prime パートナー各社のご担当者<br>キット: ${REPO_URL}<br>2026.09 版</div>
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ 全体の流れ")}
  <h2>全体の流れ</h2>
  <p class="lead">やることは5つです。Claude Code と Node.js を用意し、キットを手元に持ってきて、ロゴと色を設定し、AOM のタレントベースに接続し、タレントを選んで PDF を出します。GitHub のアカウントは要りません（自社の GitHub で共有したい場合だけ p.8）。</p>
  <div class="grid4" style="grid-template-columns:repeat(5,1fr);gap:3mm">
    <div class="card"><div class="n">1</div><b>用意する</b><p>Node.js と Claude Code を入れる（10分・一度きり）</p></div>
    <div class="card"><div class="n">2</div><b>キットを持ってくる</b><p>Claude に頼むか git clone。npm install まで（10分）</p></div>
    <div class="card"><div class="n">3</div><b>ロゴと色を設定</b><p>名義・会社名・色・ロゴを伝える。サンプルで確認（5分）</p></div>
    <div class="card"><div class="n">4</div><b>タレントベースに接続</b><p>AOM から案内された接続先を登録してログイン（5分）</p></div>
    <div class="card"><div class="n">5</div><b>タレントを選んで PDF</b><p>Claude が取得→文章作成→描画。PDF はデスクトップへ（10分）</p></div>
  </div>
  <h3>用意するもの</h3>
  <table><tr><th style="width:40mm">もの</th><th>備考</th></tr>
  <tr><td>Node.js 22.12 以上</td><td>https://nodejs.org/ の LTS。インストーラーを既定のまま進めるだけ</td></tr>
  <tr><td>Claude Code（推奨）</td><td>Anthropic のアプリ（Mac / Windows）。これがあれば以降のコマンドは全部 Claude が代行し、タレントベースからの取得も Claude が行います</td></tr>
  <tr><td>AOM からの案内</td><td>タレントベースの接続先（テナント名か URL）と、ログイン用アカウントの招待。STEP 4 で使います</td></tr>
  <tr><td>ロゴ画像</td><td>SVG が最もきれいに出ます。PNG なら背景透過・横幅 800px 以上</td></tr>
  <tr><td>GitHub アカウント</td><td>自社の GitHub に複製してチームで共有する場合だけ（p.8）</td></tr>
  </table>
  <div class="note">各ステップに <b>A. Claude Code に頼む</b> と <b>B. 自分でコマンドを打つ</b> の2通りを書いています。どちらか一方でかまいません。B のコマンドは macOS のターミナルを前提にしていますが、Windows の PowerShell でも同じです。</div>
  ${foot("2")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 1")}
  <h2><span class="step">STEP 1</span>Node.js と Claude Code を用意する</h2>
  <h3>Node.js を入れる</h3>
  <p>https://nodejs.org/ を開き、<b>LTS</b> と書かれたインストーラーをダウンロードして実行します。設定はすべて既定のままで構いません。キットの PDF 描画に使います。</p>
  <h3>Claude Code を入れる（推奨）</h3>
  <p>https://claude.com/claude-code からアプリを入れ、Anthropic のアカウントでログインします。アプリの Code 画面で「フォルダを開く」から、キットを置く親フォルダ（例: 書類）を選んでおきます。以降はこの画面のチャットに日本語で頼むだけです。</p>
  <div class="note">Claude Code を使わない場合は、ターミナルを開いておきます。macOS は ⌘ とスペースを同時に押して「ターミナル」と入力、Windows はスタートメニューで「PowerShell」と入力して Enter です。</div>
  <h3>手元に来るフォルダの中身</h3>
  <img class="shot" src="${img("folder-a.png")}">
  <div class="cap">STEP 2 で持ってくるフォルダ。触るのは ① brand（ロゴと色。STEP 3 で自動で書かれる）と ② talents（タレントのデータ）だけです。③ out には描画した PDF と確認用の画像が入ります</div>
  ${foot("3")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 2")}
  <h2><span class="step">STEP 2</span>キットを手元に持ってくる</h2>
  <p>キットは GitHub で公開しています（${REPO_URL}）。アカウントや招待は要りません。</p>
  <h3><span class="way a">A</span>Claude Code に頼む</h3>
  ${chat(`${REPO_URL} をこのフォルダに clone して、npm install まで進めて。`, "clone しました（書類/prime-talent-profile）。Node v22.12.0 を確認し、npm install も完了しています（PDF 描画用の Chrome を含む）。次はブランド設定です。ブランド名・会社名・キーカラー・ロゴのファイルを教えてください。")}
  <h3><span class="way b">B</span>自分でコマンドを打つ</h3>
  <div class="cmd">cd ~/Documents
git clone ${REPO_URL}.git
cd prime-talent-profile
npm install</div>
  <img class="shot" src="${img("term-clone-a.png")}">
  <div class="cap">① clone（書類フォルダの中に prime-talent-profile ができる）　② Node.js のバージョン確認（22.12 以上）　③ 依存関係の導入。Chrome（約170MB）もここで入るので数分かかります</div>
  <div class="note">git が入っていない Mac では、初回に「コマンドライン・デベロッパツール」の導入を求められます。「インストール」を押して待てば続行できます。Windows は https://git-scm.com/ から Git を入れてください。</div>
  ${foot("4")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 3")}
  <h2><span class="step">STEP 3</span>ロゴと色を設定する</h2>
  <h3><span class="way a">A</span>Claude Code に頼む</h3>
  ${chat("ブランド設定をして。ブランド名は Sample AI Partner、会社名は株式会社サンプル、キーカラーは #1F3A5F、ロゴは ~/Downloads/logo.svg。", "brand/brand.json を書き、ロゴを brand/ にコピーしました。サンプルを描いたので preview/_example/p-1.png で見え方を確認してください。")}
  <h3><span class="way b">B</span>自分でコマンドを打つ</h3>
  <div class="cmd">npm run setup</div>
  <img class="shot" src="${img("term-setup-a.png")}">
  <div class="cap">① ブランド名（資料に出す名義）　② 会社名　③ キーカラー（HEX 1色）　④ ロゴのパス（ファイルをウィンドウにドラッグすると入る。空でも可）　⑤ PDF の保存先（空ならデスクトップ）。最後の質問はタレントベースの接続先で、STEP 4 で説明します</div>
  <div class="two" style="grid-template-columns:1.15fr 1fr">
    <div>
      <p>フォルダの中の <b>preview/_example/p-1.png</b> を開きます。右の①〜③が自社の設定になっていれば完了です。色だけ直したいときも同じ操作で上書きでき、定型文や単価の既定値は残ります。設定は brand/ と local.config.json に書かれ、この PC の中で有効です。</p>
    </div>
    <div><img class="shot" src="${img("demo-p1-top-a.png")}" style="margin-top:0;width:88%"><div class="cap">サンプルの1ページ目（上半分）</div></div>
  </div>
  ${foot("5")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 4")}
  <h2><span class="step">STEP 4</span>AOM のタレントベースに接続する</h2>
  <p>AOM が各社に割り当てたタレントを読める接続口（MCP）を用意しています。接続先は AOM から案内します。接続すると Claude Code が <span class="inl">search_talents</span>（一覧・絞り込み）と <span class="inl">get_talent</span>（1人分の詳細）を使えます。</p>
  <h3>1. 接続先を登録する</h3>
  ${chat("タレントベースの接続先を sample にして。", ".mcp.json に talent-hub-prime（https://sample.prime.ai-ops-manager.com/mcp）を登録しました。次に /mcp を開いてログインしてください。")}
  <p>自分で行う場合は STEP 3 の <span class="inl">npm run setup</span> の最後の質問にテナント名（例: sample）を答えます。どちらもリポジトリ直下の <span class="inl">.mcp.json</span> に次の内容が書かれます。</p>
  <div class="cmd" style="font-size:9pt;line-height:1.55">{
  "mcpServers": {
    "talent-hub-prime": {
      "type": "http",
      "url": "https://sample.prime.ai-ops-manager.com/mcp"
    }
  }
}</div>
  <h3>2. Claude Code でログインする（人ごとに一度）</h3>
  <img class="shot" src="${img("cc-mcp-a.png")}" style="width:90%;margin-left:auto;margin-right:auto">
  <div class="cap">① チャットに /mcp と打つ　② talent-hub-prime を選ぶ　③ Authenticate を選ぶとブラウザが開くので、AOM から招待を受けたアカウントでログイン　④ connected と表示されれば完了（画面イメージ）</div>
  <div class="note">接続先はチームで共通（.mcp.json）、ログインは人ごとです。MCP から取れないもの（ランク・稼働不可のフラグ・面談の有無・他案件との掛け持ち）は AOM 側で管理しているので、候補を先方に出す前に AOM の担当へ稼働状況を確認してください。</div>
  ${foot("6")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 5")}
  <h2><span class="step">STEP 5</span>タレントを選んで PDF を出す</h2>
  <h3><span class="way a">A</span>Claude Code に頼む（取得から PDF まで一度で進む）</h3>
  <img class="shot" src="${img("cc-run-a.png")}" style="width:95%;margin-left:auto;margin-right:auto">
  <div class="cap">① 誰の資料を作るかと希望領域などの補足を伝える　② Claude がタレントベースから本人のデータを取得　③ 概要・課題・推薦理由・経歴・実績の文章を作って talent.json に書く　④ check と render で PDF を描画　⑤ 3ページを目視確認して報告（画面イメージ）</div>
  <div class="two" style="grid-template-columns:1.15fr 1fr">
    <div>
      <p>候補を探すところから頼むこともできます。「EC の受注業務を自動化できる人を探して。月20時間・リモート」のように案件を伝えると、Claude が割り当てリストから候補を絞り、根拠付きで提示します。その中から「1人目で資料を作って」と続ければ PDF まで進みます。</p>
      <p>実名や連絡先を書かない、現職の社名を業種表現に置き換える、といったルール（p.9）は、同梱のスキルに組み込まれています。</p>
    </div>
    <div><img class="shot" src="${img("demo-p2-top-a.png")}" style="margin-top:0;width:84%"><div class="cap">できあがりの2ページ目（上半分）。① 解決できる課題と ② 推薦理由は、取得したデータから生成されます</div></div>
  </div>
  <h3><span class="way b">B</span>自分で talent.json を書く場合</h3>
  <div class="cmd">mkdir talents/kk
cp talents/_example/talent.json talents/kk/talent.json   # 複製して中身を書き換える
npm run check -- kk
npm run render -- kk                                     # PDF はデスクトップへ</div>
  <div class="note">項目の説明は README と template/talent.schema.json にあります。「ページ N が X.Xmm はみ出しています」と出たら、文字を小さくせず文章を削って描き直します。はみ出しがある版はデスクトップに置かれません。</div>
  ${foot("7")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ 自社の GitHub で共有する場合")}
  <h2><span class="step opt">任意</span>自社の GitHub で共有する場合</h2>
  <p>ロゴの設定やタレントのデータをチームで共有したい、push のたびに README のプレビューを自動更新したい、という会社は、キットを自社の GitHub に複製してから STEP 2 を行います。個人の PC だけで使うなら不要です。</p>
  <img class="shot" src="${img("gh-header-a.png")}" style="width:84%;margin-left:auto;margin-right:auto">
  <div class="cap" style="text-align:center">キットのページで、緑の「Use this template」から「Create a new repository」を選びます（画面イメージ）</div>
  <img class="shot" src="${img("gh-form-a.png")}" style="width:84%;margin-left:auto;margin-right:auto">
  <div class="cap" style="text-align:center">① Owner に自社の組織　② 名前は自由　③ Private のまま　④ Create repository（画面イメージ）</div>
  <p>あとは STEP 2 の URL を自社のもの（https://github.com/<b>your-company</b>/prime-talent-profile）に読み替えるだけです。設定やタレントを追加したら commit と push（Claude に「コミットして push して」と頼めます）。すでに AOM のキットを clone している場合は、Claude に「push 先を自社のリポジトリに切り替えて」と頼めば付け替わります。</p>
  <div class="note">複製したリポジトリは自社のものです。ロゴ・タレントデータは AOM 側には共有されません。キットの更新（テンプレートや描画スクリプトの改善）は AOM から案内するので、案内に沿って差分を取り込んでください。</div>
  ${foot("8")}
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
  <tr><td>/mcp に talent-hub-prime が出ない</td><td>.mcp.json がキットのフォルダ直下にあるか、Claude Code がそのフォルダを開いているかを確認します。STEP 4 の 1 をやり直せば書き直されます</td></tr>
  <tr><td>ログインしても connected にならない</td><td>AOM から招待を受けたアカウントでログインしているか確認します。招待が未承認なら承認してから再度 Authenticate</td></tr>
  <tr><td>日本語が豆腐（□）になる</td><td>Google Fonts を読みに行けない環境です。オフラインなら OS のフォントに落ちます。Windows は Noto Sans JP を入れると整います</td></tr>
  <tr><td>PDF がデスクトップに無い</td><td>はみ出し警告が出た版は置かれません。文章を削って描き直してください。保存先は npm run setup で変えられます</td></tr>
  <tr><td>肩書きなどの色が薄い</td><td>明るいキーカラーは文字用に自動で暗くしています。それでも合わなければ brand.json の colors.accentText に文字用の色を書きます</td></tr>
  <tr><td>Chrome のダウンロードで止まる</td><td>プロキシ環境では PUPPETEER_DOWNLOAD_BASE_URL の設定が要ることがあります。手元の Chrome を使うなら PUPPETEER_EXECUTABLE_PATH にパスを入れます</td></tr>
  </table>
  <h3>キットの更新を取り込む</h3>
  <p>clone したフォルダで <span class="inl">git pull</span> を実行するだけです（Claude に「キットを最新にして」と頼めます）。brand/ と talents/ と local.config.json は自分の設定なので上書きされません。困ったときの問い合わせ先は AOM の担当者までお願いします。</p>
  ${foot("9")}
</section>`);

const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>${pages.join("")}</body></html>`;
fs.writeFileSync(path.join(DIR, "manual.html"), html);
await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.emulateMediaType("print");
const over = await page.evaluate(() => [...document.querySelectorAll(".page")].map((el, i) => ({ page: i + 1, over: el.scrollHeight - el.clientHeight })).filter((o) => o.over > 0));
const pdfPath = path.join(DIR, "セットアップ手順書_prime-talent-profile.pdf");
await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
const els = await page.$$(".page");
for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(DIR, `page-${i + 1}.png`) });
console.log(`overflow=${JSON.stringify(over)} pdf=${pdfPath} (${fs.statSync(pdfPath).size} bytes, ${els.length} pages)`);
await browser.close();
