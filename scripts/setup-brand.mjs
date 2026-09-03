import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { brandDir, repoRoot } from "./lib/paths.mjs";
import { validate } from "./lib/schema.mjs";

const BRAND_SCHEMA = path.join(brandDir, "brand.schema.json");
const BRAND_JSON_PATH = path.join(brandDir, "brand.json");
const PRESETS_DIR = path.join(brandDir, "presets");

const PLACEHOLDER_BASE = {
  brandName: "YOUR BRAND",
  companyName: "株式会社サンプル",
  logo: null,
  colors: { accent: "#1F3A5F" },
  typography: { webFonts: true },
};

// readline(/promises含む)は、パイプ入力で複数行が1チャンクにまとまって届くと
// 質問の合間の行を取りこぼして2問目以降が固まることがある。
// TTYでの本来の対話利用には影響が出ないため、非TTY（パイプ/リダイレクト）のときだけ
// 標準入力を先読みしてキューから順に答える方式に切り替える。
function createPrompter() {
  if (!process.stdin.isTTY) {
    let lines;
    try {
      lines = fs.readFileSync(0, "utf8").split("\n");
    } catch {
      lines = [];
    }
    let i = 0;
    return {
      question: async (query) => {
        process.stdout.write(query);
        return lines[i++] ?? "";
      },
      close: () => {},
    };
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return {
    question: (query) => new Promise((resolve) => rl.question(query, resolve)),
    close: () => rl.close(),
  };
}

function normalizeHex(input) {
  let v = String(input).trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = "#" + v.slice(1).split("").map((c) => c + c).join("");
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return null;
  return `#${v.slice(1).toUpperCase()}`;
}

const ALLOWED_LOGO_EXTENSIONS = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);

function loadPresetBase(presetName) {
  const presetPath = path.join(PRESETS_DIR, `${presetName}.json`);
  if (!fs.existsSync(presetPath)) {
    console.error(`エラー: brand/presets/${presetName}.json がありません`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(presetPath, "utf8"));
}

// --preset が無いときの土台。既存のbrand.jsonが読めればそれを使い、
// 手で直したlabels/defaults/colorsが再実行のたびに消えるのを防ぐ
function loadExistingBrand() {
  if (!fs.existsSync(BRAND_JSON_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(BRAND_JSON_PATH, "utf8"));
  } catch {
    return null;
  }
}

function copyLogoFile(sourcePath, baseDir) {
  const resolved = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(baseDir, sourcePath);
  if (!fs.existsSync(resolved)) {
    console.error(`エラー: ロゴファイルが見つかりません（${resolved}）`);
    process.exit(1);
  }
  const ext = path.extname(resolved).toLowerCase();
  if (!ALLOWED_LOGO_EXTENSIONS.has(ext)) {
    console.error("エラー: ロゴは svg/png/jpg/webp のみ対応です");
    process.exit(1);
  }
  const fileName = path.basename(resolved);
  const dest = path.join(brandDir, fileName);
  if (path.resolve(resolved) !== path.resolve(dest)) {
    fs.copyFileSync(resolved, dest);
  }
  return fileName;
}

// requestedPath: 未指定なら""。baseの既定ロゴパス（baseLogoDir基準）と一致すればheight/colorも引き継ぐ。
// baseLogoDirは「baseの持つlogo.fileが実際に置かれているディレクトリ」
// （presetならbrand/presets、既存brand.json土台ならbrand本体＝コピー不要で済む）
function resolveLogo(requestedPath, base, baseLogoDir) {
  const baseLogo = base?.logo ?? null;

  if (!requestedPath) {
    if (!baseLogo) return null;
    const fileName = copyLogoFile(baseLogo.file, baseLogoDir);
    return {
      file: fileName,
      ...(baseLogo.height ? { height: baseLogo.height } : {}),
      ...(baseLogo.color ? { color: baseLogo.color } : {}),
    };
  }

  const isBaseDefault = baseLogo?.file === requestedPath;
  const dir = isBaseDefault ? baseLogoDir : process.cwd();
  const fileName = copyLogoFile(requestedPath, dir);

  if (isBaseDefault) {
    return {
      file: fileName,
      ...(baseLogo.height ? { height: baseLogo.height } : {}),
      ...(baseLogo.color ? { color: baseLogo.color } : {}),
    };
  }
  return { file: fileName };
}

async function promptWithDefault(rl, question, def) {
  const shown = def === undefined || def === null || def === "" ? "" : `（既定: ${def}）`;
  const answer = (await rl.question(`${question}${shown}: `)).trim();
  return answer === "" ? (def ?? "") : answer;
}

async function confirmOverwrite(rl) {
  const answer = (await rl.question("brand/brand.json は既に存在します。上書きしますか（y/N）: ")).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

async function runInteractive(rl, base, baseLogoDir) {
  const brandName = await promptWithDefault(rl, "ブランド名", base.brandName);
  const companyName = await promptWithDefault(rl, "会社名", base.companyName);

  let accent = null;
  while (!accent) {
    const accentInput = await promptWithDefault(rl, "キーカラー（HEX）", base.colors?.accent ?? "#1F3A5F");
    accent = normalizeHex(accentInput);
    if (!accent) console.log("HEXの形式が不正です（例: #1F3A5F）。もう一度入力してください。");
  }

  const logoInput = await promptWithDefault(rl, "ロゴファイルのパス（空でスキップ）", base.logo?.file ?? "");
  const logo = resolveLogo(logoInput, base, baseLogoDir);

  const hideDefault = base.defaults?.hidePhoto ? "y" : "N";
  const hideInput = (await promptWithDefault(rl, "写真を伏せますか（y/N）", hideDefault)).toLowerCase();
  const hidePhoto = hideInput === "y" || hideInput === "yes";

  return { brandName, companyName, accent, logo, hidePhoto };
}

function runNonInteractive(values, base, baseLogoDir) {
  if (!values.name || !values.company || !values.accent) {
    console.error("エラー: --non-interactive には --name --company --accent が必須です");
    process.exit(1);
  }

  const accent = normalizeHex(values.accent);
  if (!accent) {
    console.error(`エラー: --accent の形式が不正です（${values.accent}）`);
    process.exit(1);
  }

  // --logo省略時、baseが既存brand.jsonでロゴがbrand/に実在するならそのまま維持する
  // （copyLogoFileは同一パスへのコピーを自動でスキップするので、既存分は実質ノーコピー）
  const logo = resolveLogo(values.logo ?? "", base, baseLogoDir);
  const hidePhoto = values["hide-photo"] ?? false;

  return { brandName: values.name, companyName: values.company, accent, logo, hidePhoto };
}

function buildBrandJson({ brandName, companyName, accent, logo, hidePhoto, base }) {
  const baseColors = base.colors ?? {};
  const accentChanged = baseColors.accent && baseColors.accent.toUpperCase() !== accent.toUpperCase();
  const colors = { ...baseColors, accent };
  if (accentChanged) {
    delete colors.accentDark;
    delete colors.tint;
    delete colors.accentText;
  }

  return {
    $schema: "./brand.schema.json",
    brandName,
    companyName,
    logo,
    colors,
    typography: base.typography ?? { webFonts: true },
    labels: base.labels,
    defaults: { ...(base.defaults ?? {}), hidePhoto },
  };
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      preset: { type: "string" },
      "non-interactive": { type: "boolean", default: false },
      name: { type: "string" },
      company: { type: "string" },
      accent: { type: "string" },
      logo: { type: "string" },
      "hide-photo": { type: "boolean", default: false },
      "no-preview": { type: "boolean", default: false },
    },
  });

  // 対話中は同じprompterを最後まで使い回す（質問のたびに作り直さない）
  const rl = values["non-interactive"] ? null : createPrompter();

  if (fs.existsSync(BRAND_JSON_PATH) && rl) {
    const proceed = await confirmOverwrite(rl);
    if (!proceed) {
      console.log("中止しました");
      rl.close();
      process.exit(0);
      return;
    }
  }

  // --presetがあればそれを土台にする。無ければ既存のbrand.jsonが読めるならそれを土台にし
  // （labels/defaults/typography/colorsの手直しが再実行で消えないようにする）、
  // 存在しないときだけ初回向けのプレースホルダにする
  const existingBase = values.preset ? null : loadExistingBrand();
  const base = values.preset ? loadPresetBase(values.preset) : (existingBase ?? PLACEHOLDER_BASE);
  // baseの持つlogo.fileが実在するディレクトリ（プレースホルダ土台はlogoが無いので使われない）
  const baseLogoDir = values.preset ? PRESETS_DIR : brandDir;

  const answers = rl ? await runInteractive(rl, base, baseLogoDir) : runNonInteractive(values, base, baseLogoDir);
  if (rl) rl.close();

  const brandJson = buildBrandJson({ ...answers, base });

  validate(BRAND_SCHEMA, brandJson, "brand/brand.json（生成結果）");
  fs.writeFileSync(BRAND_JSON_PATH, JSON.stringify(brandJson, null, 2) + "\n", "utf8");
  console.log(`brand/brand.json を書き込みました${values.preset ? `（preset: ${values.preset}）` : ""}`);

  // talents/側の不備でsetupが止まらないよう、ここではbrand.jsonだけを見る
  const checkResult = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "check.mjs"), "--brand-only"], {
    stdio: "inherit",
  });
  if (checkResult.status !== 0) {
    process.exit(checkResult.status ?? 1);
    return;
  }

  if (!values["no-preview"]) {
    console.log("プレビューを生成します...");
    const renderResult = spawnSync(
      process.execPath,
      [path.join(repoRoot, "scripts", "render.mjs"), "_example", "--out", "preview"],
      { stdio: "inherit" },
    );
    // はみ出し(exit 2)はbrand設定自体の失敗ではないので、setupとしては素通りさせる
    if (renderResult.status !== 0 && renderResult.status !== 2) {
      process.exit(renderResult.status ?? 1);
      return;
    }
  }

  process.exit(0);
}

main();
