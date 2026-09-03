import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import nunjucks from "nunjucks";
import puppeteer from "puppeteer";
import { repoRoot, talentsDir, templateDir } from "./lib/paths.mjs";
import { loadBrand } from "./lib/brand.mjs";
import { loadTalent } from "./lib/talent.mjs";
import { assertSlug } from "./lib/slug.mjs";

function listAllSlugs() {
  // _example はプレビュー用の架空サンプルなので --all（納品物の一括生成）には含めない。
  // .始まりは作業用ディレクトリ扱い。npm run preview は _example を明示指定するので影響しない
  return fs
    .readdirSync(talentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
}

// 端末ごとの設定（git 管理外）。いまは PDF の保存先だけ
function loadLocalConfig() {
  const p = path.join(repoRoot, "local.config.json");
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    console.error("警告: local.config.json を読めないので無視します");
    return {};
  }
}

function expandHome(p) {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

// 仕上がった PDF を置く場所。優先順位: --deliver > 環境変数 PTP_DELIVER_DIR > local.config.json > デスクトップ。
// CI と --no-deliver では配らない
function resolveDeliverDir({ cliValue, noDeliver, local }) {
  if (noDeliver || process.env.CI) return null;
  const raw = cliValue ?? process.env.PTP_DELIVER_DIR ?? local.deliverDir ?? path.join(os.homedir(), "Desktop");
  return path.resolve(expandHome(String(raw)));
}

function deliverPdf({ pdfPath, initials, deliverDir }) {
  fs.mkdirSync(deliverDir, { recursive: true });
  const dest = path.join(deliverDir, `タレントプロフィール_${initials}_ブラインド版.pdf`);
  fs.copyFileSync(pdfPath, dest);
  return dest;
}

function countPdfPages(bytes) {
  // puppeteerのバージョンによってpage.pdf()の戻り値がUint8Arrayのことがあり、
  // その場合Uint8Array#toString(encoding)は引数を無視してしまうのでBufferへ変換してから読む
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : 0;
}

async function renderOne({ slug, brand, templateEnv, css, browser, outDir, png, scale, allowOverflow, deliverDir }) {
  assertSlug(slug);
  const talent = loadTalent(slug, brand);
  const meta = {
    year: Number(String(talent.issued).split(".")[0]),
    total: talent.pages.length,
    generatedAt: new Date().toISOString(),
  };
  const context = { css, brand, talent, pages: talent.pages, meta };

  let html;
  try {
    html = templateEnv.render("profile.njk", context);
  } catch (renderErr) {
    const err = new Error(`テンプレートの描画に失敗しました: ${renderErr.message}`);
    err.exitCode = 1;
    throw err;
  }

  const slugOutDir = path.join(outDir, slug);
  fs.mkdirSync(slugOutDir, { recursive: true });
  fs.writeFileSync(path.join(slugOutDir, "profile.html"), html, "utf8");

  const page = await browser.newPage();
  let overflow = [];
  let domPageCount = 0;
  let pdfBytes = 0;
  // talent.mjs側の警告（写真の欠落・形式不備など）を先頭に積み、はみ出し等の警告と合流させる
  const warnings = [...talent.warnings];

  try {
    await page.setContent(html, { waitUntil: ["load", "networkidle0"] });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaType("print");

    overflow = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll(".page").forEach((el, i) => {
        // .page は overflow:hidden の固定高さ。本文域（.body）はフッターの上までしか無いので、
        // 本文がフッターや下余白に食い込んだ場合は .body の scrollHeight にだけ現れる。両方見て大きい方を採る
        const body = el.querySelector(".body");
        const pageDiff = el.scrollHeight - el.clientHeight;
        const bodyDiff = body ? body.scrollHeight - body.clientHeight : 0;
        const diff = Math.max(pageDiff, bodyDiff);
        if (diff > 0) {
          const mm = Math.round((diff / 96) * 25.4 * 10) / 10;
          out.push({ page: i + 1, mm });
        }
      });
      return out;
    });
    domPageCount = await page.evaluate(() => document.querySelectorAll(".page").length);

    for (const o of overflow) {
      warnings.push(`ページ ${o.page} が ${o.mm}mm はみ出しています（本文を削ってください）`);
    }

    const pdfPath = path.join(slugOutDir, "profile.pdf");
    const pdfBuffer = await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    pdfBytes = pdfBuffer.length;

    const pdfPageCount = countPdfPages(pdfBuffer);
    if (pdfPageCount !== domPageCount) {
      warnings.push(`PDFのページ数（${pdfPageCount}）と描画ページ数（${domPageCount}）が一致しません`);
    }

    if (png) {
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: scale });
      const pageEls = await page.$$(".page");
      for (let i = 0; i < pageEls.length; i += 1) {
        await pageEls[i].screenshot({ path: path.join(slugOutDir, `p-${i + 1}.png`) });
      }
    }
  } finally {
    await page.close();
  }

  const hasOverflow = overflow.length > 0;

  // 仕上がった PDF だけを配る。_ 始まり（サンプル・作業用）と、はみ出しのある版は配らない
  let delivered = null;
  if (deliverDir && !slug.startsWith("_")) {
    if (hasOverflow) {
      warnings.push("はみ出しがあるため保存先には配っていません（直してから描き直してください）");
    } else {
      delivered = deliverPdf({ pdfPath: path.join(slugOutDir, "profile.pdf"), initials: talent.initials, deliverDir });
    }
  }

  const report = {
    slug,
    brand: brand.brandName,
    pages: domPageCount,
    pdfBytes,
    overflow,
    warnings,
    delivered,
    generatedAt: meta.generatedAt,
  };
  fs.writeFileSync(path.join(slugOutDir, "render.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`[${slug}] ${path.join(slugOutDir, "profile.pdf")} を生成しました（${domPageCount}ページ, ${pdfBytes} bytes）`);
  if (delivered) console.log(`[${slug}] 保存: ${delivered}`);
  for (const w of warnings) {
    console.log(`[${slug}] 警告: ${w}`);
  }
  const exitCode = hasOverflow && !allowOverflow ? 2 : 0;
  return { slug, exitCode };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const noPng = rawArgs.includes("--no-png");
  const noDeliver = rawArgs.includes("--no-deliver");
  const filteredArgs = rawArgs.filter((a) => a !== "--no-png" && a !== "--no-deliver");

  const { values, positionals } = parseArgs({
    args: filteredArgs,
    allowPositionals: true,
    options: {
      all: { type: "boolean", default: false },
      brand: { type: "string" },
      out: { type: "string", default: "out" },
      scale: { type: "string", default: "1.5" },
      deliver: { type: "string" },
      theme: { type: "string" },
      "allow-overflow": { type: "boolean", default: false },
    },
  });

  const png = !noPng;
  const scale = Number(values.scale) || 1.5;
  const allowOverflow = values["allow-overflow"];
  const outDir = path.resolve(process.cwd(), values.out);
  const deliverDir = resolveDeliverDir({ cliValue: values.deliver, noDeliver, local: loadLocalConfig() });

  let slugs;
  if (values.all) {
    slugs = listAllSlugs();
    if (slugs.length === 0) {
      console.error("エラー: talents/ 配下にディレクトリがありません");
      process.exit(1);
      return;
    }
  } else if (positionals.length > 0) {
    slugs = positionals;
  } else {
    console.error("エラー: slugを指定するか --all を付けてください（--all は _ や . で始まるディレクトリを除外します）");
    process.exit(1);
    return;
  }

  let brand;
  let css;
  try {
    brand = loadBrand(values.brand);
    const cssPath = path.join(templateDir, "styles.css");
    if (!fs.existsSync(cssPath)) {
      const err = new Error(`${path.relative(repoRoot, cssPath)} がありません`);
      err.exitCode = 1;
      throw err;
    }
    css = fs.readFileSync(cssPath, "utf8");

    // テーマ（色と面の使い方）。--theme が brand.json の theme より優先。panel は基本CSSそのもの
    if (values.theme) brand.theme = values.theme;
    if (brand.theme && brand.theme !== "panel") {
      const themePath = path.join(templateDir, "themes", `${brand.theme}.css`);
      if (!fs.existsSync(themePath)) {
        const err = new Error(`テーマ ${brand.theme} がありません（template/themes/ を確認）`);
        err.exitCode = 1;
        throw err;
      }
      css += "\n" + fs.readFileSync(themePath, "utf8");
    }
  } catch (err) {
    console.error(`エラー: ${err.message}`);
    process.exit(err.exitCode ?? 1);
    return;
  }

  const templateEnv = nunjucks.configure(templateDir, { autoescape: true, throwOnUndefined: false });

  let browser;
  // 優先順位: 入力エラー（何かのslugが1件でも完全に失敗）が最優先で1。
  // それが無ければ、はみ出し（PDFは出ているが仕上がりが崩れている）があれば2。
  // Math.maxで単純比較すると、はみ出し2が入力エラー1に「勝って」しまい、
  // PDFが出ていないタレントがいても2（はみ出しだけ）として扱われてしまう。
  let hadInputError = false;
  let hadOverflow = false;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
    });

    for (const slug of slugs) {
      try {
        const { exitCode } = await renderOne({
          slug,
          brand,
          templateEnv,
          css,
          browser,
          outDir,
          png,
          scale,
          allowOverflow,
          deliverDir,
        });
        if (exitCode === 2) hadOverflow = true;
      } catch (err) {
        console.error(`[${slug}] エラー: ${err.message}`);
        hadInputError = true;
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  process.exit(hadInputError ? 1 : hadOverflow ? 2 : 0);
}

main();
