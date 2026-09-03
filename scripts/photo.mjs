import fs from "node:fs";
import path from "node:path";
import { talentsDir } from "./lib/paths.mjs";
import { assertSlug } from "./lib/slug.mjs";

const MIME_EXT_BY_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

function extFromUrl(url) {
  const clean = url.split("?")[0].split("#")[0];
  const ext = path.extname(clean).replace(".", "").toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (["jpg", "png", "webp"].includes(ext)) return ext;
  return null;
}

function assertHttpUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    const err = new Error(`URLの形式が不正です: ${url}`);
    err.exitCode = 1;
    throw err;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    const err = new Error(`http/https以外のURLは指定できません: ${url}`);
    err.exitCode = 1;
    throw err;
  }
}

async function downloadPhoto(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  let res;
  try {
    res = await fetch(url, { redirect: "follow", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const contentLength = Number(res.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_PHOTO_BYTES) {
    const err = new Error("20MBを超えています");
    err.tooLarge = true;
    throw err;
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const ext = MIME_EXT_BY_CONTENT_TYPE[contentType] ?? extFromUrl(url);
  if (!ext) {
    throw new Error("画像形式を判定できません（jpg/png/webpのみ対応）");
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_PHOTO_BYTES) {
    const err = new Error("20MBを超えています");
    err.tooLarge = true;
    throw err;
  }
  return { ext, buffer };
}

async function main() {
  const [slug, url] = process.argv.slice(2);
  if (!slug || !url) {
    console.error("使い方: npm run photo -- <slug> <url>");
    process.exit(1);
    return;
  }

  try {
    assertSlug(slug);
    assertHttpUrl(url);
  } catch (err) {
    console.error(`エラー: ${err.message}`);
    process.exit(err.exitCode ?? 1);
    return;
  }

  const talentDir = path.join(talentsDir, slug);
  const talentJsonPath = path.join(talentDir, "talent.json");
  if (!fs.existsSync(talentJsonPath)) {
    console.error(`エラー: talents/${slug}/talent.json がありません`);
    process.exit(1);
    return;
  }

  let ext;
  let buffer;
  try {
    ({ ext, buffer } = await downloadPhoto(url));
  } catch (err) {
    if (err.tooLarge) {
      console.error("エラー: 写真のサイズが20MBを超えています");
      process.exit(1);
      return;
    }
    console.error(
      `エラー: 写真のダウンロードに失敗しました（${err.message}）。署名URLの期限切れを疑ってください（取り直して再実行）`,
    );
    process.exit(1);
    return;
  }

  const photoFileName = `photo.${ext}`;
  fs.writeFileSync(path.join(talentDir, photoFileName), buffer);

  const talentData = JSON.parse(fs.readFileSync(talentJsonPath, "utf8"));
  talentData.photo = photoFileName;
  fs.writeFileSync(talentJsonPath, JSON.stringify(talentData, null, 2) + "\n", "utf8");

  console.log(`talents/${slug}/${photoFileName} に保存し、talent.json の photo を更新しました`);
}

main();
