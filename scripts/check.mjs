import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { brandDir, talentsDir, repoRoot } from "./lib/paths.mjs";
import { validate } from "./lib/schema.mjs";
import { assertSlug } from "./lib/slug.mjs";
import { findPhotoWarning } from "./lib/talent.mjs";

const BRAND_SCHEMA = path.join(brandDir, "brand.schema.json");
const TALENT_SCHEMA = path.join(repoRoot, "template", "talent.schema.json");

const EMAIL_RE = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+/g;
const PHONE_RE = /0\d{1,4}-\d{1,4}-\d{4}/g;
// SNS・ポートフォリオ系。ここに当たったら実名特定に繋がりうるのでエラー扱いにする
const URL_RE =
  /(https?:\/\/)?(www\.)?(x\.com|twitter\.com|linkedin\.com|facebook\.com|instagram\.com|github\.com|note\.com|qiita\.com|zenn\.dev|wantedly\.com|youtube\.com|speakerdeck\.com|lit\.link)\/\S+/gi;
// @に続くハンドルらしき文字列。ただしメールアドレスの@localの一部は除外する
const HANDLE_RE = /(?<![\w@.])@[A-Za-z0-9_]{2,}/g;

function listAllSlugs() {
  return fs
    .readdirSync(talentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

function isNotePath(keyPath) {
  // _note は作業メモで資料には出ないので、ヒットしても警告に留める
  return keyPath === "_note" || keyPath.startsWith("_note.") || keyPath.startsWith("_note[");
}

function scanPii(value, keyPath, hits) {
  if (typeof value === "string") {
    for (const { re, severity } of [
      { re: EMAIL_RE, severity: "error" },
      { re: PHONE_RE, severity: "error" },
      { re: URL_RE, severity: "error" },
      { re: HANDLE_RE, severity: "warning" },
    ]) {
      const found = value.match(re);
      if (found) {
        for (const f of found) {
          hits.push({ path: keyPath || "(root)", text: f, severity: isNotePath(keyPath) ? "warning" : severity });
        }
      }
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanPii(v, `${keyPath}[${i}]`, hits));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      scanPii(v, keyPath ? `${keyPath}.${k}` : k, hits);
    }
  }
}

function checkBrand() {
  const brandPath = path.join(brandDir, "brand.json");
  const warnings = [];
  if (!fs.existsSync(brandPath)) {
    console.error("エラー: brand/brand.json がありません");
    return { ok: false, warnings };
  }

  const raw = JSON.parse(fs.readFileSync(brandPath, "utf8"));
  try {
    validate(BRAND_SCHEMA, raw, "brand/brand.json");
  } catch (err) {
    console.error(err.message);
    return { ok: false, warnings };
  }

  if (raw.brandName === "YOUR BRAND") {
    warnings.push("ブランド未設定: brand/brand.json の brandName が YOUR BRAND のままです（npm run setup で設定してください）");
  }

  return { ok: true, warnings };
}

function checkTalent(slug) {
  const talentDir = path.join(talentsDir, slug);
  const talentPath = path.join(talentDir, "talent.json");
  const warnings = [];
  if (!fs.existsSync(talentPath)) {
    console.error(`エラー: talents/${slug}/talent.json がありません`);
    return { ok: false, warnings };
  }

  const raw = JSON.parse(fs.readFileSync(talentPath, "utf8"));
  try {
    validate(TALENT_SCHEMA, raw, `talents/${slug}/talent.json`);
  } catch (err) {
    console.error(err.message);
    return { ok: false, warnings };
  }

  let ok = true;

  const hits = [];
  scanPii(raw, "", hits);
  for (const h of hits) {
    if (h.severity === "error") {
      ok = false;
      console.error(`個人情報を含む可能性: talents/${slug}/talent.json の ${h.path}: ${h.text}（削除してください）`);
    } else {
      warnings.push(`個人情報の可能性: talents/${slug}/talent.json の ${h.path}: ${h.text}`);
    }
  }

  const photoWarning = findPhotoWarning(talentDir, raw.photo);
  if (photoWarning) warnings.push(photoWarning);

  return { ok, warnings };
}

function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      "brand-only": { type: "boolean", default: false },
    },
  });

  const brandOnly = values["brand-only"];

  let ok = true;
  const allWarnings = [];
  let targets = [];

  const brandResult = checkBrand();
  ok = ok && brandResult.ok;
  allWarnings.push(...brandResult.warnings);

  if (!brandOnly) {
    if (positionals.length > 0) {
      for (const slug of positionals) {
        try {
          assertSlug(slug);
        } catch (err) {
          console.error(`エラー: ${err.message}`);
          process.exit(err.exitCode ?? 1);
          return;
        }
      }
      targets = positionals;
    } else {
      targets = listAllSlugs();
    }

    for (const slug of targets) {
      const result = checkTalent(slug);
      ok = ok && result.ok;
      allWarnings.push(...result.warnings);
    }
  }

  if (allWarnings.length > 0) {
    console.log("--- 警告 ---");
    for (const w of allWarnings) console.log(w);
  }

  if (ok) {
    console.log(
      brandOnly
        ? "検証OK: brand/brand.json"
        : `検証OK: brand/brand.json, talents(${targets.length}件): ${targets.join(", ") || "なし"}`,
    );
  }

  process.exit(ok ? 0 : 1);
}

main();
