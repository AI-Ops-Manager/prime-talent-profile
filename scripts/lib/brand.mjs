import fs from "node:fs";
import path from "node:path";
import { brandDir } from "./paths.mjs";
import { validate } from "./schema.mjs";
import { deriveColors } from "./color.mjs";

const SCHEMA_PATH = path.join(brandDir, "brand.schema.json");

// brand/brand.json に入っている文言と同じにする（未指定時の既定値）
const LABEL_DEFAULTS = {
  docType: "ご紹介資料",
  docTitle: "タレントのご紹介（ブラインド版）",
  confidential: "Strictly Confidential",
  blindNote:
    "氏名・ご連絡先は非公開。ご関心をいただいた場合に、実名・詳細プロフィール・ポートフォリオを開示します。経歴・実績はタレントデータベース収録の内容をそのまま掲載しています。",
  ctaLead: "こちらのタレントにご関心をお持ちいただけましたら",
  ctaBody:
    "実名・詳細プロフィール・ポートフォリオの開示、ご本人とのオンライン面談（30分程度）をセッティングします。稼働量・関与範囲・条件は柔軟にご相談いただけます。",
  fitTitle: "解決できる課題",
  pointsTitle: "推薦理由",
  projectsTitle: "実績",
  featuredLabel: null, // null なら talent 側で決める（課題ありの資料=適合／汎用=注目）
};

const DEFAULTS_DEFAULTS = {
  hidePhoto: false,
  rate: "15,000円/h〜",
  rateNote: null,
  hoursNote: "増減ご相談可",
  contract: "業務委託（準委任）",
  start: "応相談",
  workStyle: "応相談",
};

const LOGO_MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function missingFileError(relPathUnderBrand) {
  const err = new Error(`brand/${relPathUnderBrand} がありません`);
  err.exitCode = 1;
  return err;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function stripSvgWrapper(source) {
  return source
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

// viewBoxが無ければwidth/heightから生成してから、width/heightは削除してviewBoxに任せる
// （<img>で埋め込むため実表示サイズはCSS側のheightで決まる）
function normalizeSvgRoot(svg, logoConfig) {
  const rootMatch = svg.match(/<svg\b[^>]*>/i);
  if (!rootMatch) {
    const err = new Error(`brand/${logoConfig.file} がSVGとして読み取れません`);
    err.exitCode = 1;
    throw err;
  }

  let rootTag = rootMatch[0];

  if (!/viewBox=/i.test(rootTag)) {
    const w = rootTag.match(/\swidth="([\d.]+)"/i);
    const h = rootTag.match(/\sheight="([\d.]+)"/i);
    if (w && h) {
      rootTag = rootTag.replace(/<svg\b/i, `<svg viewBox="0 0 ${w[1]} ${h[1]}"`);
    }
  }
  rootTag = rootTag.replace(/\swidth="[^"]*"/i, "").replace(/\sheight="[^"]*"/i, "");

  return svg.slice(0, rootMatch.index) + rootTag + svg.slice(rootMatch.index + rootMatch[0].length);
}

// <img>としてラスタ扱いになるため、ページ側のCSS（currentColor経由の継承）は効かない。
// fill="currentColor"のロゴはテキストの段階でリテラルな色に置き換えてから埋め込む。
function applySvgColor(svg, logoConfig, colors) {
  const color = logoConfig.color ?? "original";
  if (color === "accent") {
    return svg.replace(/currentColor/gi, colors.accentText);
  }
  if (color === "ink") {
    return svg.replace(/currentColor/gi, colors.ink);
  }
  return svg;
}

function buildSvgImg(filePath, logoConfig, colors, brandName) {
  let svg = stripSvgWrapper(fs.readFileSync(filePath, "utf8"));
  svg = normalizeSvgRoot(svg, logoConfig);
  svg = applySvgColor(svg, logoConfig, colors);
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return `<img class="logo-img" alt="${escapeAttr(brandName)}" src="data:image/svg+xml;base64,${base64}">`;
}

// ロゴは brand.json と同じディレクトリから相対で探す（--brand で presets/ 等を直接指しても動くように）
function resolveLogoHtml(logoConfig, colors, brandName, baseDir) {
  const filePath = path.join(baseDir, logoConfig.file);
  if (!fs.existsSync(filePath)) {
    const err = new Error(`ロゴ ${path.relative(process.cwd(), filePath)} がありません`);
    err.exitCode = 1;
    throw err;
  }

  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".svg") {
    // SVGを生のままDOMに挿すと、ロゴ内の<style>が資料全体に効いたり<script>が実行されたりする事故があるため、
    // 他の画像形式と同じくdata URIの<img>にする（ロゴ内マークアップは画像として隔離される）
    return buildSvgImg(filePath, logoConfig, colors, brandName);
  }

  if (LOGO_MIME_BY_EXT[ext]) {
    const data = fs.readFileSync(filePath);
    const mime = LOGO_MIME_BY_EXT[ext];
    return `<img class="logo-img" alt="${escapeAttr(brandName)}" src="data:${mime};base64,${data.toString("base64")}">`;
  }

  const err = new Error(`brand/${logoConfig.file} は対応していない形式です（svg/png/jpg/jpeg/webpのみ）`);
  err.exitCode = 1;
  throw err;
}

// 省略時は brand/brand.json。指定があれば実行ディレクトリからの相対パス（例: --brand brand/presets/aom.json）
export function resolveBrandPath(file) {
  if (!file) return path.join(brandDir, "brand.json");
  return path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
}

export function loadBrand(file) {
  const brandPath = resolveBrandPath(file);
  if (!fs.existsSync(brandPath)) {
    if (!file) throw missingFileError("brand.json");
    const err = new Error(`ブランド設定 ${path.relative(process.cwd(), brandPath)} がありません`);
    err.exitCode = 1;
    throw err;
  }

  const raw = JSON.parse(fs.readFileSync(brandPath, "utf8"));
  validate(SCHEMA_PATH, raw, "ブランド設定");

  const brandName = raw.brandName;
  const companyName = raw.companyName;
  const colors = deriveColors(raw.colors);

  const labels = {
    docType: raw.labels?.docType ?? LABEL_DEFAULTS.docType,
    docTitle: raw.labels?.docTitle ?? LABEL_DEFAULTS.docTitle,
    confidential: raw.labels?.confidential ?? LABEL_DEFAULTS.confidential,
    blindNote: raw.labels?.blindNote ?? LABEL_DEFAULTS.blindNote,
    ctaLead: raw.labels?.ctaLead ?? LABEL_DEFAULTS.ctaLead,
    ctaBody: raw.labels?.ctaBody ?? LABEL_DEFAULTS.ctaBody,
    fitTitle: raw.labels?.fitTitle ?? LABEL_DEFAULTS.fitTitle,
    pointsTitle: raw.labels?.pointsTitle ?? LABEL_DEFAULTS.pointsTitle,
    projectsTitle: raw.labels?.projectsTitle ?? LABEL_DEFAULTS.projectsTitle,
    featuredLabel: raw.labels?.featuredLabel ?? LABEL_DEFAULTS.featuredLabel,
    footer: raw.labels?.footer ?? `${brandName}（${companyName}）`,
  };

  const defaults = {
    hidePhoto: raw.defaults?.hidePhoto ?? DEFAULTS_DEFAULTS.hidePhoto,
    rate: raw.defaults?.rate ?? DEFAULTS_DEFAULTS.rate,
    rateNote: raw.defaults?.rateNote ?? DEFAULTS_DEFAULTS.rateNote,
    hoursNote: raw.defaults?.hoursNote ?? DEFAULTS_DEFAULTS.hoursNote,
    contract: raw.defaults?.contract ?? DEFAULTS_DEFAULTS.contract,
    start: raw.defaults?.start ?? DEFAULTS_DEFAULTS.start,
    workStyle: raw.defaults?.workStyle ?? DEFAULTS_DEFAULTS.workStyle,
  };

  const typography = {
    webFonts: raw.typography?.webFonts ?? true,
  };
  const theme = raw.theme ?? "letterhead";

  const logoHeight = raw.logo?.height ?? "7mm";
  const logoHtml = raw.logo ? resolveLogoHtml(raw.logo, colors, brandName, path.dirname(brandPath)) : null;

  return {
    brandName,
    companyName,
    logoHtml,
    logoHeight,
    colors,
    labels,
    typography,
    theme,
    // テンプレートは参照しない。talent.mjs の既定値解決に使う
    defaults,
  };
}
