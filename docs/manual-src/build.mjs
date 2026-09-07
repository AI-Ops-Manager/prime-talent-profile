// セットアップ手順書（1冊・Skitch風の注釈付き画面イメージ → A4 PDF）を組み立てる
// すべて Claude Code のアプリ（チャット）で進める前提。コマンドを打つ手順は載せない（README に残す）。
// STEP 4 は Prime のタレント一覧 → 設定「MCP連携」タブ → Claude Code に登録 → /mcp で認証、の動線。
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DIR = path.join(ROOT, "out/manual");
const IMG = path.join(DIR, "img");
fs.mkdirSync(IMG, { recursive: true });
const REPO_URL = "https://github.com/AI-Ops-Manager/prime-talent-profile";
const PRIME = "aom.prime.ai-ops-manager.com"; // 例として AOM テナント。各社は招待メールの URL に読み替える
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

// ---------- 画面イメージ: Claude Code のアプリ ----------
function ccApp(rows, h, session = "セットアップ") {
  const body = rows.map(([k, t], i) => {
    if (k === "item" || k === "itemok") {
      const [name, st, btn] = t.split("|");
      return `<div class="item" data-a="l${i}"><b>${esc(name)}</b><span class="st ${k === "itemok" ? "ok" : ""}">${esc(st)}</span>${btn ? `<span class="btn">${esc(btn)}</span>` : ""}</div>`;
    }
    return `<div class="${k}" data-a="l${i}">${esc(t)}</div>`;
  }).join("");
  return `<html><head><meta charset="utf-8"><style>
  body{margin:0;width:1100px;background:#e9e9ec;font-family:${FONT}}
  .win{position:absolute;left:0;top:0;width:1100px;height:${h}px;background:#fff;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
  .bar{height:38px;background:#f3f3f5;border-bottom:1px solid #e2e2e6;display:flex;align-items:center;padding:0 14px;gap:8px;flex:none}
  .bar i{width:12px;height:12px;border-radius:50%;display:inline-block}.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
  .bar span{margin-left:auto;margin-right:auto;color:#666;font-size:13px}
  .main{flex:1;display:flex;min-height:0}
  .side{width:200px;background:#f7f7f9;border-right:1px solid #e6e6ea;padding:14px 10px;font-size:12.5px;color:#555;flex:none}
  .side .folder{font-weight:700;color:#111;margin-bottom:10px;padding:0 6px;font-size:13px}
  .side .s{padding:6px 8px;border-radius:6px;color:#666;margin-bottom:2px}.side .s.on{background:#e7e7ee;color:#111}
  .chat{flex:1;display:flex;flex-direction:column;padding:16px 70px 14px 24px;gap:9px;min-width:0}
  .u{align-self:flex-end;max-width:80%;background:#eef0f6;border-radius:12px;padding:9px 13px;font-size:14px;color:#111;line-height:1.55}
  .tool{display:flex;gap:8px;align-items:center;font-family:${MONO};font-size:12.5px;color:#333;width:max-content;max-width:100%}
  .tool::before{content:"";width:8px;height:8px;border-radius:50%;background:#7c5cff;flex:none}
  .res{font-family:${MONO};font-size:12px;color:#777;padding-left:14px;border-left:2px solid #e4e4e8;margin-left:3px;width:max-content;max-width:100%}
  .say{font-size:14px;color:#111;line-height:1.6;max-width:92%}
  .hd{font-size:13px;font-weight:700;color:#111;margin-top:2px}
  .item{display:flex;align-items:center;gap:12px;border:1px solid #e2e2e6;border-radius:8px;padding:8px 12px;font-size:13px;color:#111;width:600px}
  .item b{font-family:${MONO};font-weight:600}.item .st{color:#b45309;font-size:12px;margin-left:auto}.item .st.ok{color:#15803d}
  .item .btn{border:1px solid #cfcfd6;border-radius:6px;padding:3px 10px;font-size:12px;background:#fff;color:#111}
  .dim{font-size:12px;color:#888}
  .input{margin-top:auto;border:1px solid #d6d6dc;border-radius:10px;padding:10px 12px;color:#9a9a9a;font-size:13px}
  </style></head><body><div class="win"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>Claude Code</span></div>
  <div class="main"><div class="side"><div class="folder">prime-talent-profile</div><div class="s on">${esc(session)}</div><div class="s">新しいセッション</div></div>
  <div class="chat">${body}<div class="input">Claude に頼む…</div></div></div></div></body></html>`;
}

// ---------- 画面イメージ: Prime（ブラウザ） ----------
const primeCss = `
body{margin:0;width:1100px;background:#e9e9ec;font-family:${FONT};color:#1a1a1a}
.win{position:absolute;left:0;top:0;width:1100px;background:#f6f7f9;border-radius:10px;overflow:hidden}
.bbar{height:40px;background:#ececef;display:flex;align-items:center;padding:0 14px;gap:10px;border-bottom:1px solid #dcdce0}
.bbar i{width:12px;height:12px;border-radius:50%;display:inline-block}.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
.url{margin-left:20px;background:#fff;border:1px solid #d6d6dc;border-radius:7px;padding:5px 12px;font-size:13px;color:#333;width:520px}
.url b{color:#111;font-weight:600}
.nav{height:52px;background:#fff;border-bottom:1px solid #e3e3e8;display:flex;align-items:center;padding:0 24px;position:relative}
.badge{border:1px solid #d9d9df;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px}
.badge i{width:14px;height:14px;border-radius:4px;background:#1F3A5F;display:inline-block}
.tabs{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:28px;height:52px}
.tabs span{display:flex;align-items:center;font-size:14px;color:#666;border-bottom:2px solid transparent}
.tabs span.on{color:#111;font-weight:600;border-bottom-color:#1F3A5F}
.avatar{margin-left:auto;width:32px;height:32px;border-radius:50%;background:#1F3A5F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.menu{position:absolute;right:20px;top:60px;width:240px;background:#fff;border:1px solid #dedee3;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:6px;z-index:5;font-size:13px}
.menu .who{padding:8px 10px;border-bottom:1px solid #ececf0;margin-bottom:4px}.menu .who small{display:block;color:#777;font-size:11px;margin-top:2px}
.menu div.it{padding:8px 10px;border-radius:6px;color:#222}.menu div.it.hi{background:#eef0f6;font-weight:600}
.content{padding:22px 28px}
.tool{display:flex;gap:10px;max-width:640px;margin:0 auto 18px}
.search{flex:1;background:#fff;border:1px solid #d9d9df;border-radius:8px;padding:8px 12px;font-size:13px;color:#999}
.btn{background:#fff;border:1px solid #d9d9df;border-radius:8px;padding:8px 12px;font-size:13px;color:#555}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:#fff;border:1px solid #e1e1e6;border-radius:12px;padding:14px 16px;font-size:12.5px}
.st{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#555;margin-bottom:10px}.st i{width:8px;height:8px;border-radius:50%;display:inline-block}
.id{display:flex;gap:10px;align-items:center;margin-bottom:10px}.id .av{width:40px;height:40px;border-radius:50%;background:#e6e8ee;color:#333;display:flex;align-items:center;justify-content:center;font-weight:700}
.id b{font-size:15px;display:block}.id small{color:#666;font-size:11.5px}
.pill{display:inline-block;border-radius:999px;padding:2px 8px;font-size:11px;background:#e8f5ec;color:#1b7f3b;margin-bottom:8px}
.tags span{display:inline-block;border:1px solid #e1e1e6;border-radius:6px;padding:2px 7px;font-size:11px;color:#444;margin:0 4px 6px 0}
.meta{color:#666;font-size:11.5px;margin-top:4px}
.h1{font-size:19px;font-weight:700;margin:4px 0 16px}
.stabs{display:flex;gap:4px;border-bottom:1px solid #e1e1e6;margin-bottom:20px}
.stabs span{padding:8px 16px;font-size:13.5px;color:#666;border-bottom:2px solid transparent;margin-bottom:-1px}.stabs span.on{color:#111;font-weight:600;border-bottom-color:#1F3A5F}
.sec h3{font-size:16px;font-weight:700;margin:0 0 4px}.sec p{font-size:13px;color:#666;margin:0 0 16px;line-height:1.6}
.box{background:#fff;border:1px solid #e1e1e6;border-radius:12px;padding:16px 18px;margin-bottom:14px}
.box h4{font-size:13px;font-weight:600;margin:0 0 10px}
.code{display:flex;gap:8px;align-items:stretch}.code code{flex:1;background:#1c1d22;color:#f2f2f2;border-radius:8px;padding:9px 12px;font-family:${MONO};font-size:12px;display:flex;align-items:center}
.code .cp{border:1px solid #d9d9df;border-radius:8px;padding:0 12px;font-size:12px;display:flex;align-items:center;background:#fff;white-space:nowrap}
.box .note{font-size:11.5px;color:#777;margin-top:10px;line-height:1.6}
.box ol{margin:0 0 10px 18px;padding:0;font-size:12.5px;color:#555;line-height:1.8}
.fade{position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(rgba(246,247,249,0),#f6f7f9)}`;
const primeShell = (h, urlHtml, tab, content, menu = "") => `<html><head><meta charset="utf-8"><style>${primeCss}.win{height:${h}px}</style></head><body><div class="win">
<div class="bbar"><i class="r"></i><i class="y"></i><i class="g"></i><div class="url" data-a="url">${urlHtml}</div></div>
<div class="nav"><div class="badge"><i></i>株式会社サンプル</div><div class="tabs"><span class="${tab === "talents" ? "on" : ""}">タレント</span><span>アサイン</span><span>チャット</span></div><div class="avatar" data-a="avatar">Y</div>${menu}</div>
<div class="content">${content}</div><div class="fade"></div></div></body></html>`;

const card = (st, color, ini, label, sub, intent, tags, meta1, meta2, a) => `<div class="card" ${a ? `data-a="${a}"` : ""}>
<div class="st"><i style="background:${color}"></i>${st}</div>
<div class="id"><div class="av">${ini}</div><div><b>${label}</b><small>${sub}</small></div></div>
<span class="pill">${intent}</span>
<div class="tags">${tags.map((t) => `<span>${t}</span>`).join("")}</div>
<div class="meta">${meta1}</div><div class="meta">${meta2}</div></div>`;
const talentsHtml = primeShell(460, `https://<b>${PRIME}</b>/talents`, "talents", `
<div class="tool"><div class="search">キーワードで検索</div><div class="btn">絞り込み</div><div class="btn">並び替え</div></div>
<div class="grid">
${card("稼働可能", "#22a05b", "K", "K.K.", "Sales Ops / 業務自動化", "案件参画意欲 積極的", ["デベロッパー", "シニア", "リモート"], "38歳 · フリーランス", "¥6,000〜8,000/h · 週20時間", "card1")}
${card("一部稼働可能", "#e0a300", "M", "M.S.", "バックオフィス / RAG", "案件参画意欲 条件次第", ["プロンプトエンジニア", "ミドル", "ハイブリッド"], "34歳 · 会社員", "¥5,000〜7,000/h · 週10時間")}
${card("稼働可能", "#22a05b", "R", "R.T.", "マーケティング / 生成AI", "案件参画意欲 積極的", ["エキスパート", "リード", "リモート"], "41歳 · フリーランス", "¥8,000〜10,000/h · 週15時間")}
</div>`, `<div class="menu"><div class="who">山田 太郎<small>yamada@sample.co.jp · 管理者</small></div><div class="it hi" data-a="settings">設定</div><div class="it">メンバー</div><div class="it">言語</div><div class="it">ログアウト</div></div>`);
const talentsA = await shot(talentsHtml, 1100, 460, "prime-talents.png");

const mcpHtml = primeShell(620, `https://<b>${PRIME}</b>/settings?tab=mcp`, "", `
<div class="h1">設定</div>
<div class="stabs"><span>アカウント</span><span>メンバー</span><span class="on" data-a="tab">MCP連携</span></div>
<div class="sec"><h3>MCP連携</h3><p>AIアシスタント（Claude など）からタレント情報を検索・参照できる MCP サーバーを提供しています。お使いのクライアントに以下の URL を登録してください。</p></div>
<div class="box"><h4>MCPサーバーURL</h4><div class="code" data-a="mcpurl"><code>https://${PRIME}/mcp</code><span class="cp">URLをコピー</span></div>
<div class="note">接続時にブラウザでこのサイトのログイン画面が開きます。お持ちのアカウントでログインすると連携が完了します（トークンの発行・貼り付けは不要です）。</div></div>
<div class="box"><h4>Claude Code（CLI）</h4><ol><li>ターミナルで以下のコマンドを実行する</li><li>初回利用時に /mcp コマンドから認証し、ブラウザでログインする</li></ol>
<div class="code" data-a="cmd"><code>claude mcp add --transport http talent-hub-prime https://${PRIME}/mcp</code><span class="cp">コマンドをコピー</span></div></div>
<div class="box"><h4>claude.ai（ブラウザ / モバイル）・Claude Desktop</h4><ol><li>設定 → コネクタ → 「カスタムコネクタを追加」を開く</li></ol></div>`);
const mcpA = await shot(mcpHtml, 1100, 620, "prime-mcp.png");

// ---------- 画面イメージ: GitHub（任意ページ用） ----------
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
.win{position:absolute;left:0;top:0;width:1100px;height:360px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 0 #ddd}
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
<div class="row" data-a="brand"><span class="ic"></span><span class="name">brand</span><span class="desc">ロゴとキーカラーの設定。STEP 3 で Claude が書く</span></div>
<div class="row" data-a="talents"><span class="ic"></span><span class="name">talents</span><span class="desc">タレント1名につき1フォルダ。STEP 5 で Claude が書く（_example は架空のサンプル）</span></div>
<div class="row" data-a="out"><span class="ic"></span><span class="name">out</span><span class="desc">描画したときにできる作業用の出力（PDF・確認用の画像）</span></div>
<div class="row"><span class="ic"></span><span class="name">docs</span><span class="desc">この手順書・設計の説明</span></div>
<div class="row"><span class="ic"></span><span class="name">scripts / template</span><span class="desc">描画のプログラムと資料のひな形（触らない）</span></div>
<div class="row"><span class="ic f"></span><span class="name">README.md</span><span class="desc">使い方の全体（コマンドで動かす場合もここ）</span></div>
<div class="row"><span class="ic f"></span><span class="name">.mcp.json</span><span class="desc">STEP 4 で Claude が書く、タレントベースの接続先</span></div>
</div></div></body></html>`;
const folderA = await shot(folderHtml, 1100, 360, "folder.png");

// ---------- Claude Code の各画面 ----------
const cloneA = await shot(ccApp([
  ["u", `${REPO_URL} をこのフォルダに clone して、npm install まで進めて。`],
  ["tool", `Bash(git clone ${REPO_URL}.git)`],
  ["res", "Cloning into 'prime-talent-profile'... done."],
  ["tool", "Bash(node -v)"],
  ["res", "v22.12.0"],
  ["tool", "Bash(npm install)"],
  ["res", "added 128 packages（PDF 描画用の Chrome 約170MB を含む。数分かかる）"],
  ["say", "clone しました（書類/prime-talent-profile）。次はブランド設定です。ブランド名・会社名・キーカラー・ロゴのファイルを教えてください。"],
], 420), 1100, 420, "cc-clone.png");
const brandA = await shot(ccApp([
  ["u", "ブランド設定をして。ブランド名は Sample AI Partner、会社名は株式会社サンプル、キーカラーは #1F3A5F、ロゴは ~/Downloads/logo.svg。"],
  ["tool", "Bash(cp ~/Downloads/logo.svg brand/logo.svg)"],
  ["tool", "Write(brand/brand.json)"],
  ["res", "brandName / companyName / colors.accent / logo.file を設定"],
  ["tool", "Bash(npm run preview)"],
  ["res", "[_example] preview/_example/profile.pdf を生成しました（3ページ）"],
  ["say", "設定しました。preview/_example/p-1.png で見え方を確認してください。上端の色帯とロゴが自社のものになっています。"],
], 390), 1100, 390, "cc-brand.png");
const ccMcpA = await shot(ccApp([
  ["u", `Prime の MCP を登録して。URL は https://${PRIME}/mcp`],
  ["tool", "Write(.mcp.json)"],
  ["res", "talent-hub-prime（http）として登録"],
  ["say", "登録しました。/mcp を開いて talent-hub-prime を認証してください。ブラウザで Prime のログイン画面が開きます。"],
  ["u", "/mcp"],
  ["hd", "MCP サーバー"],
  ["item", "talent-hub-prime|認証が必要|認証する"],
  ["dim", "ブラウザで Prime のログイン画面が開く。Prime と同じアカウントでログインする（トークンの貼り付けは不要）"],
  ["itemok", "talent-hub-prime|接続済み · 2 ツール（search_talents, get_talent）"],
], 470, "MCP 接続"), 1100, 470, "cc-mcp.png");
const runA = await shot(ccApp([
  ["u", `https://${PRIME}/talents/3f2a…（一覧で開いた人の URL）のブラインドプロフィールを作って PDF にして。希望領域はバックオフィス業務の AI 化。`],
  ["tool", "talent-hub-prime · get_talent (id: 3f2a…)"],
  ["res", "1件取得（経歴5件・実績4件・スキル17件）"],
  ["tool", "Write(talents/kk/talent.json)"],
  ["res", "概要・解決できる課題3点・推薦理由4点・経歴3件・実績3件を作成"],
  ["tool", "Bash(npm run check -- kk)"],
  ["res", "検証OK: brand/brand.json, talents(1件): kk"],
  ["tool", "Bash(npm run render -- kk)"],
  ["res", "[kk] 保存: /Users/you/Desktop/タレントプロフィール_K.K._ブラインド版.pdf"],
  ["tool", "Read(out/kk/p-1.png … p-3.png)"],
  ["res", "3ページを目視確認。氏名・連絡先・現職の社名は出ていない"],
  ["say", "できました。PDF はデスクトップに置きました。現職の社名は業種表現に置き換えています。"],
], 510, "K.K. プロフィール"), 1100, 510, "cc-run.png");
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
await annotate("prime-talents.png", 1100, 460, [
  boxOf(talentsA.url, 3), badgeAt(1, talentsA.url, -14, 0),
  boxOf(talentsA.card1), badgeAt(2, talentsA.card1),
  boxOf(talentsA.avatar, 4), badgeAt(3, talentsA.avatar, -12, -8),
  boxOf(talentsA.settings, 2), badgeAt(4, talentsA.settings, -12, 0),
], "prime-talents-a.png");
await annotate("prime-mcp.png", 1100, 620, [
  boxOf(mcpA.url, 3), badgeAt(1, mcpA.url, -14, 0),
  boxOf(mcpA.tab, 2), badgeAt(2, mcpA.tab),
  boxOf(mcpA.mcpurl), { t: "badge", n: 3, x: mcpA.mcpurl.x - 18, y: mcpA.mcpurl.cy },
  boxOf(mcpA.cmd), { t: "badge", n: 4, x: mcpA.cmd.x - 18, y: mcpA.cmd.cy },
], "prime-mcp-a.png");
await annotate("cc-clone.png", 1100, 420, [
  boxOf(cloneA.l0), badgeRight(1, cloneA.l0),
  boxOf(cloneA.l7), badgeRight(2, cloneA.l7),
], "cc-clone-a.png");
await annotate("cc-brand.png", 1100, 390, [
  boxOf(brandA.l0), badgeRight(1, brandA.l0),
  boxOf(brandA.l6), badgeRight(2, brandA.l6),
], "cc-brand-a.png");
await annotate("cc-mcp.png", 1100, 470, [
  boxOf(ccMcpA.l0), badgeRight(1, ccMcpA.l0),
  boxOf(ccMcpA.l4), badgeRight(2, ccMcpA.l4),
  boxOf(ccMcpA.l6), badgeRight(3, ccMcpA.l6),
  boxOf(ccMcpA.l8), badgeRight(4, ccMcpA.l8),
], "cc-mcp-a.png");
await annotate("cc-run.png", 1100, 510, [
  boxOf(runA.l0), badgeRight(1, runA.l0),
  boxOf(runA.l1), badgeRight(2, runA.l1),
  boxOf(runA.l3), badgeRight(3, runA.l3),
  boxOf(runA.l7), badgeRight(4, runA.l7),
  boxOf(runA.l11), badgeRight(5, runA.l11),
], "cc-run-a.png");
await annotate("folder.png", 1100, 360, [
  boxOf(folderA.brand, 3), badgeRight(1, folderA.brand),
  boxOf(folderA.talents, 3), badgeRight(2, folderA.talents),
  boxOf(folderA.out, 3), badgeRight(3, folderA.out),
], "folder-a.png");
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
p,li{font-size:10.5pt;line-height:1.8;color:#333}
ul,ol{padding-left:5.5mm;margin:1mm 0 3mm}
li{margin-bottom:.8mm}
.lead{font-size:12pt;line-height:1.9;color:#333}
.shot{width:100%;border:.25mm solid #ddd;border-radius:1mm;display:block;margin:3mm 0 2mm}
.cap{font-size:8.5pt;color:#8a8a8a;margin-bottom:5mm;line-height:1.6}
.inl{font-family:${MONO};font-size:9.5pt;background:#f4f4f6;border-radius:.6mm;padding:.3mm 1.5mm}
.note{border-left:.8mm solid #0000D4;background:#f6f6f8;padding:3mm 4mm;margin:3mm 0;font-size:10pt;line-height:1.75;color:#333}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin:6mm 0}
.card{border:.25mm solid #ddd;border-radius:1mm;padding:4mm}
.card .n{font-family:Helvetica Neue,Arial;font-size:22pt;font-weight:700;color:#0000D4;line-height:1}
.card b{display:block;font-size:10.5pt;margin:2mm 0 1.5mm;line-height:1.4}
.card p{font-size:9pt;line-height:1.6;color:#555}
table{border-collapse:collapse;width:100%;font-size:10pt;margin:2mm 0 4mm}
th,td{border-bottom:.25mm solid #ddd;padding:2.2mm 2mm;text-align:left;vertical-align:top;line-height:1.6}
th{font-weight:700;background:#f4f4f6}
.cover{padding-top:40mm}
.cover .kicker{font-size:11pt;letter-spacing:.2em;color:#0000D4;font-weight:700;margin-bottom:6mm}
.cover .sub{font-size:13pt;color:#555;margin-top:6mm;line-height:1.8;max-width:150mm}
.cover .meta{position:absolute;left:16mm;bottom:22mm;font-size:10pt;color:#555;line-height:1.9}
.two{display:grid;grid-template-columns:1.15fr 1fr;gap:6mm;align-items:start}
.ask{border:.25mm solid #d6d6dc;border-left:.8mm solid #1a1a1a;border-radius:1mm;padding:2.6mm 4mm;margin:2mm 0 4mm;font-size:10.5pt;line-height:1.7;color:#111}
.ask b{font-size:8.5pt;color:#8a8a8a;font-weight:600;display:block;margin-bottom:.5mm;letter-spacing:.05em}
.url{font-family:${MONO};font-size:9.5pt}
`;
const head = (t) => `<div class="head"><img src="${logo}"><span>${t}</span></div>`;
const foot = (n) => `<div class="foot"><span>AI Ops Manager株式会社 ｜ Prime パートナー向け</span><span>${n}</span></div>`;
const ask = (u) => `<div class="ask"><b>Claude に頼む文</b>${u}</div>`;

const pages = [];
pages.push(`<section class="page cover">
  <img src="${logo}" style="height:9mm;margin-bottom:22mm">
  <div class="kicker">SETUP GUIDE</div>
  <h1>タレントプロフィール作成キット<br>セットアップ手順書</h1>
  <div class="sub">キットを手元の PC に持ってきて、自社のロゴとキーカラーを設定し、Prime のタレントベースにつないで、タレント1名の紹介資料（ブラインド版・A4 3ページ）を PDF で出すまで。操作はすべて Claude Code のアプリのチャットで進みます。所要時間の目安は40分です。</div>
  <div class="meta">対象: Prime パートナー各社のご担当者<br>キット: ${REPO_URL}<br>2026.09 版</div>
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ 全体の流れ")}
  <h2>全体の流れ</h2>
  <p class="lead">やることは5つです。Claude Code のアプリを用意し、キットを手元に持ってきて、ロゴと色を設定し、Prime のタレントベースにつなぎ、タレントを選んで PDF を出します。コマンドを打つ場面はありません。Claude に日本語で頼めば、Claude が代わりに実行します。</p>
  <div class="grid">
    <div class="card"><div class="n">1</div><b>用意する</b><p>Node.js と Claude Code のアプリを入れる（10分・一度きり）</p></div>
    <div class="card"><div class="n">2</div><b>キットを持ってくる</b><p>Claude に URL を渡して clone してもらう（10分）</p></div>
    <div class="card"><div class="n">3</div><b>ロゴと色を設定</b><p>名義・会社名・色・ロゴを伝える。サンプルで確認（5分）</p></div>
    <div class="card"><div class="n">4</div><b>タレントベースにつなぐ</b><p>Prime の設定画面にある MCP の URL を Claude に渡してログイン（5分）</p></div>
    <div class="card"><div class="n">5</div><b>タレントを選んで PDF</b><p>Prime の一覧で選んだ人の URL を渡す。Claude が取得→文章→PDF（10分）</p></div>
  </div>
  <h3>用意するもの</h3>
  <table><tr><th style="width:44mm">もの</th><th>備考</th></tr>
  <tr><td>Claude Code のアプリ</td><td>Anthropic のデスクトップアプリ（Mac / Windows）。Anthropic のアカウントでログインします</td></tr>
  <tr><td>Node.js 22.12 以上</td><td>PDF の描画に使います。https://nodejs.org/ の LTS を既定のまま入れるだけ</td></tr>
  <tr><td>Prime のアカウント</td><td>AOM からの招待メールで作ったもの。<span class="url">https://<b>自社名</b>.prime.ai-ops-manager.com</span> にログインできる状態にしておきます（この手順書では例として ${PRIME} を使います）</td></tr>
  <tr><td>ロゴ画像</td><td>SVG が最もきれいに出ます。PNG なら背景透過・横幅 800px 以上</td></tr>
  </table>
  <div class="note">GitHub のアカウントは要りません。キットは公開されていて、URL だけで持ってこられます。チームでロゴ設定やタレントデータを共有したい場合だけ p.9 の手順を足します。ターミナルでコマンドを打って動かす方法は、キットの README にあります。</div>
  ${foot("2")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 1")}
  <h2><span class="step">STEP 1</span>Node.js と Claude Code のアプリを用意する</h2>
  <h3>Node.js を入れる</h3>
  <p>https://nodejs.org/ を開き、<b>LTS</b> と書かれたインストーラーをダウンロードして実行します。設定はすべて既定のままで構いません。</p>
  <h3>Claude Code のアプリを入れる</h3>
  <p>https://claude.com/claude-code からデスクトップアプリを入れ、Anthropic のアカウントでログインします。アプリの <b>Code</b> 画面で「フォルダを開く」を押し、キットを置く親フォルダ（例: 書類）を選びます。以降はこの画面のチャットに日本語で頼むだけです。</p>
  <div class="note">Claude は頼んだ内容に応じてファイルを書いたりコマンドを実行したりします。初回は「実行してよいか」の確認が出るので、内容を見て許可してください。同じ操作を毎回聞かれるのが煩わしければ「このフォルダでは今後も許可」を選べます。</div>
  <h3>STEP 2 のあとに手元にできるフォルダ</h3>
  <img class="shot" src="${img("folder-a.png")}">
  <div class="cap">自分で触るファイルはありません。① brand はロゴと色、② talents はタレントのデータで、どちらも Claude が書きます。③ out には描画した PDF と確認用の画像が入ります。仕上がった PDF は別途デスクトップにも置かれます</div>
  ${foot("3")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 2")}
  <h2><span class="step">STEP 2</span>キットを手元に持ってくる</h2>
  <p>キットは GitHub で公開しています。Claude Code のチャットに URL を渡すと、Claude が clone（ダウンロード）と依存関係の導入まで進めます。アカウントや招待は要りません。</p>
  ${ask(`${REPO_URL} をこのフォルダに clone して、npm install まで進めて。`)}
  <img class="shot" src="${img("cc-clone-a.png")}">
  <div class="cap">① 頼む文はそのまま貼ってかまいません　② 途中の実行（git clone・npm install）は Claude が行い、終わると次に何を教えればよいかを返します。npm install は Chrome（約170MB）を含むので数分かかります（画面イメージ）</div>
  <div class="note">git が入っていない Mac では、初回に「コマンドライン・デベロッパツール」の導入を求めるダイアログが出ます。「インストール」を押して待ってから、もう一度同じ文で頼んでください。Windows で git が無いと言われたら https://git-scm.com/ から Git を入れます。</div>
  <p>終わったら、Code 画面の「フォルダを開く」で、できあがった <b>prime-talent-profile</b> フォルダそのものを開き直します。以降の STEP はこのフォルダを開いた状態で進めます。</p>
  ${foot("4")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 3")}
  <h2><span class="step">STEP 3</span>ロゴと色を設定する</h2>
  <p>ブランド名（資料に出す名義）・会社名・キーカラー（HEX 1色）・ロゴのファイルの4つを伝えます。ロゴはファイルをチャット欄にドラッグするか、置き場所を書きます。</p>
  ${ask("ブランド設定をして。ブランド名は Sample AI Partner、会社名は株式会社サンプル、キーカラーは #1F3A5F、ロゴは ~/Downloads/logo.svg。")}
  <img class="shot" src="${img("cc-brand-a.png")}">
  <div class="cap">① 4つの値を伝える　② Claude が brand/brand.json を書き、ロゴをコピーし、サンプルを描いて確認先を返します（画面イメージ）</div>
  <div class="two">
    <div>
      <p>フォルダの中の <b>preview/_example/p-1.png</b> を開きます。右の①〜③が自社の設定になっていれば完了です。色だけ直したいときは「キーカラーを #C8102E にして」のように頼めば、定型文や単価の既定値はそのままに色だけ変わります。</p>
      <p>写真を出さない運用にしたい、PDF の保存先をデスクトップ以外にしたい、といった希望もこの段階で伝えておきます。</p>
    </div>
    <div><img class="shot" src="${img("demo-p1-top-a.png")}" style="margin-top:0;width:88%"><div class="cap">サンプルの1ページ目（上半分）</div></div>
  </div>
  ${foot("5")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 4（1/2）")}
  <h2><span class="step">STEP 4</span>Prime につなぐ 1/2：Prime で URL をコピー</h2>
  <p>Prime には、Claude Code から直接タレント情報を読める接続口（MCP）があります。その URL は Prime の設定画面に出ています。まず Prime にログインして URL をコピーします。トークンの発行や貼り付けはありません。</p>
  <img class="shot" src="${img("prime-talents-a.png")}" style="width:84%;margin-left:auto;margin-right:auto">
  <div class="cap">① <span class="url">https://${PRIME}/talents</span> にログイン（自社の URL は招待メールのもの。先頭の会社名部分だけが違います）　② 自社に割り当てられたタレントの一覧。カードを開くと詳細ページになり、その URL を STEP 5 で使います　③ 右上のアイコン　④ 「設定」（画面イメージ）</div>
  <img class="shot" src="${img("prime-mcp-a.png")}" style="width:84%;margin-left:auto;margin-right:auto">
  <div class="cap">① 設定画面（<span class="url">https://${PRIME}/settings?tab=mcp</span>）　② 「MCP連携」タブ　③ 「MCPサーバーURL」を「URLをコピー」でコピーする。これが Claude に渡す接続先です　④ Claude Code 向けのコマンドも出ています。こちらをコピーして Claude に「これを実行して」と渡しても同じです（画面イメージ）</div>
  ${foot("6")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 4（2/2）")}
  <h2><span class="step">STEP 4</span>Prime につなぐ 2/2：Claude Code に登録</h2>
  <p>コピーした URL を Claude に渡して登録してもらい、続けて <b>/mcp</b> で認証します。認証は人ごとに一度です。</p>
  ${ask(`Prime の MCP を登録して。URL は https://${PRIME}/mcp`)}
  <img class="shot" src="${img("cc-mcp-a.png")}">
  <div class="cap">① URL を渡す。Claude がフォルダ直下の .mcp.json に talent-hub-prime として書きます　② チャット欄に /mcp と打つと MCP サーバーの一覧が出る　③ talent-hub-prime の「認証する」を押すとブラウザで Prime のログイン画面が開くので、Prime と同じアカウントでログイン　④ 「接続済み」になれば完了（画面イメージ）</div>
  <h3>つながると何ができるか</h3>
  <table><tr><th style="width:36mm">ツール</th><th>Claude がすること</th></tr>
  <tr><td><span class="inl">search_talents</span></td><td>自社に割り当てられたタレントをキーワードで検索する（経歴・実績の本文まで横断）</td></tr>
  <tr><td><span class="inl">get_talent</span></td><td>タレント1名の詳細（スキル・経歴・実績・稼働状況）を取得する。STEP 5 の資料はここから作られます</td></tr>
  </table>
  <div class="note">読めるのは自社に割り当てられたタレントだけで、読み取り専用です。.mcp.json はフォルダの中にあるので、同じフォルダを開いた同僚にも接続先が引き継がれます（ログインは各自）。ランク・稼働不可のフラグ・面談の有無・他案件との掛け持ちは MCP からは取れず、AOM 側で管理しています。候補を先方に出す前に AOM の担当へ稼働状況を確認してください。</div>
  ${foot("7")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ STEP 5")}
  <h2><span class="step">STEP 5</span>タレントを選んで PDF を出す</h2>
  <p>Prime の一覧（STEP 4 の①②）で気になる人のカードを開き、その詳細ページの URL をコピーして Claude に渡します。希望領域や打診先の状況を一言添えると、課題と推薦理由がその文脈で書かれます。</p>
  ${ask(`https://${PRIME}/talents/3f2a…（一覧で開いた人の URL）のブラインドプロフィールを作って PDF にして。希望領域はバックオフィス業務の AI 化。`)}
  <img class="shot" src="${img("cc-run-a.png")}" style="width:95%;margin-left:auto;margin-right:auto">
  <div class="cap">① URL と補足を渡す　② Claude が MCP で本人のデータを取得　③ 概要・解決できる課題・推薦理由・経歴・実績の文章を作って talent.json に書く　④ 検証と描画を通して PDF をデスクトップに保存　⑤ 3ページを目視確認して報告（画面イメージ）</div>
  <div class="two">
    <div>
      <p>候補探しから頼むこともできます。「EC の受注業務を自動化できる人を探して。月20時間・リモート」のように案件を伝えると、Claude が割り当てリストから候補を絞り、根拠付きで提示します。その中から「1人目で資料を作って」と続ければ PDF まで進みます。</p>
      <p>実名や連絡先を書かない、現職の社名を業種表現に置き換える、といったルール（p.10）は、同梱のスキルに組み込まれています。</p>
    </div>
    <div><img class="shot" src="${img("demo-p2-top-a.png")}" style="margin-top:0;width:84%"><div class="cap">できあがりの2ページ目（上半分）。① 解決できる課題と ② 推薦理由は、取得したデータから生成されます</div></div>
  </div>
  ${foot("8")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ 自社の GitHub で共有する場合")}
  <h2><span class="step opt">任意</span>自社の GitHub で共有する場合</h2>
  <p>ロゴの設定やタレントのデータをチームで共有したい、変更のたびに README のプレビューを自動更新したい、という会社は、キットを自社の GitHub に複製してから STEP 2 を行います。個人の PC だけで使うなら不要です。</p>
  <img class="shot" src="${img("gh-header-a.png")}" style="width:84%;margin-left:auto;margin-right:auto">
  <div class="cap" style="text-align:center">キットのページで、緑の「Use this template」から「Create a new repository」を選びます（画面イメージ）</div>
  <img class="shot" src="${img("gh-form-a.png")}" style="width:84%;margin-left:auto;margin-right:auto">
  <div class="cap" style="text-align:center">① Owner に自社の組織　② 名前は自由　③ Private のまま　④ Create repository（画面イメージ）</div>
  <p>あとは STEP 2 で Claude に渡す URL を自社のもの（https://github.com/<b>your-company</b>/prime-talent-profile）にするだけです。設定やタレントを追加したら「コミットして push して」と頼みます。すでに AOM のキットを clone している場合は「push 先を自社のリポジトリに切り替えて」と頼めば付け替わります。</p>
  <div class="note">複製したリポジトリは自社のものです。ロゴ・タレントデータは AOM 側には共有されません。キットの更新（テンプレートや描画の改善）は AOM から案内するので、案内に沿って差分を取り込んでください。</div>
  ${foot("9")}
</section>`);
pages.push(`<section class="page">${head("セットアップ手順書 ｜ ルールと困ったとき")}
  <h2>資料に書いてはいけないこと</h2>
  <ul>
    <li>氏名（イニシャルだけ）、連絡先、SNS のアカウント、本人の面談予約リンク</li>
    <li>現職・自社の社名。「IPO準備企業」「マーケティング支援会社（社名はご面談時に開示）」のように業種で書く</li>
    <li>データベースに無い数字・実績。過去の在籍企業は、大手であれば実名で残してよい</li>
  </ul>
  <p>Claude は描画前に検証を通し、メールアドレス・電話番号・SNS の URL が混ざっていれば止まります。実名や現職の社名は機械では見つけられないので、送る前に人の目で確認してください。</p>
  <h2 style="margin-top:8mm">困ったとき</h2>
  <table><tr><th style="width:52mm">症状</th><th>対処</th></tr>
  <tr><td>/mcp に talent-hub-prime が出ない</td><td>Code 画面で開いているのがキットのフォルダ（prime-talent-profile）か確認します。親フォルダを開いたままだと出ません。開き直してから STEP 4 の 2/2 をやり直します</td></tr>
  <tr><td>認証しても「接続済み」にならない</td><td>ブラウザで Prime に別のアカウントでログインしている可能性があります。Prime からログアウトし、招待を受けたアカウントで入り直してから、もう一度「認証する」</td></tr>
  <tr><td>Claude が「タレントが見つからない」と言う</td><td>渡した URL の人が自社の割り当てに入っているか、Prime の一覧で確認します。割り当ての追加は AOM の担当へ</td></tr>
  <tr><td>PDF がデスクトップに無い</td><td>ページからはみ出す分量だと保存されません。Claude に「はみ出したページの文章を削って描き直して」と頼みます。保存先は「PDF の保存先を〜にして」で変えられます</td></tr>
  <tr><td>日本語が豆腐（□）になる</td><td>Google Fonts を読みに行けない環境です。Windows は Noto Sans JP を入れると整います</td></tr>
  <tr><td>肩書きなどの色が薄い</td><td>明るいキーカラーは文字用に自動で暗くしています。それでも合わなければ「文字用の色を #〜にして」と頼みます</td></tr>
  </table>
  <h3>キットの更新を取り込む</h3>
  <p>「キットを最新にして」と頼むだけです（git pull が走ります）。brand と talents と保存先の設定は自分のものなので上書きされません。困ったときの問い合わせ先は AOM の担当者までお願いします。</p>
  ${foot("10")}
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
