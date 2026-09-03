import fs from "node:fs";
import path from "node:path";
import { repoRoot, talentsDir } from "./paths.mjs";
import { validate } from "./schema.mjs";
import { inline } from "./markdown.mjs";
import { assertSlug } from "./slug.mjs";

// スキーマは常に本物のtemplate/を見る（PTP_TEMPLATE_DIRのテスト用差し替えは見た目だけに効かせる）
const SCHEMA_PATH = path.join(repoRoot, "template", "talent.schema.json");

const AVAILABILITY_LABELS = {
  available: "稼働可能",
  partially_available: "一部稼働可",
  on_assignment: "稼働中（時期応相談）",
  unavailable: "稼働調整中",
};

const PHOTO_MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const PAGES_WITH_PROJECTS = [
  ["hero", "facts", "overview", "coverage"],
  ["career", "skills"],
  ["projects", "cta"],
];

const PAGES_WITHOUT_PROJECTS = [
  ["hero", "facts", "overview", "coverage"],
  ["career", "skills", "cta"],
];

function jstYearMonth(date) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  return `${y}.${m}`;
}

function resolvePhotoSrc(talentDir, photo, hidePhoto) {
  if (!photo || hidePhoto) return null;
  const filePath = path.join(talentDir, photo);
  const ext = path.extname(filePath).toLowerCase();
  const mime = PHOTO_MIME_BY_EXT[ext];
  if (!mime || !fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}

// 写真の指定が無言で落ちないよう、resolvePhotoSrcがnullを返す理由を文言にする。
// check.mjsからも同じ判定・同じ文言で使う。
export function findPhotoWarning(talentDir, photo) {
  if (!photo) return null;
  const ext = path.extname(photo).toLowerCase();
  if (!PHOTO_MIME_BY_EXT[ext]) {
    return `写真 ${photo} の形式に対応していません（jpg/png/webp/svg。イニシャル枠で出力します）`;
  }
  if (!fs.existsSync(path.join(talentDir, photo))) {
    return `写真 ${photo} が見つかりません（イニシャル枠で出力します）`;
  }
  return null;
}

function buildFacts(raw, defaults) {
  const f = raw.facts ?? {};

  const hours = f.hours ?? "応相談";
  const hoursNote = f.hoursNote ?? defaults.hoursNote ?? null;
  const rate = f.rate ?? defaults.rate ?? "別途ご案内";
  const rateNote = f.rateNote ?? defaults.rateNote ?? null;
  const start = f.start ?? defaults.start;
  const contract = f.contract ?? defaults.contract;
  const workStyle = f.workStyle ?? defaults.workStyle;
  const focus = f.focus ?? "ご面談時にご相談";

  return [
    { k: "稼働目安", v: hours, note: hoursNote },
    { k: "参考単価", v: rate, note: rateNote },
    { k: "稼働開始", v: start, note: null },
    { k: "契約形態", v: contract, note: null },
    { k: "勤務スタイル", v: workStyle, note: null },
    { k: "希望領域", v: focus, note: null },
  ];
}

export function loadTalent(slug, brand) {
  assertSlug(slug);

  const talentDir = path.join(talentsDir, slug);
  const filePath = path.join(talentDir, "talent.json");
  if (!fs.existsSync(filePath)) {
    const err = new Error(`talents/${slug}/talent.json がありません`);
    err.exitCode = 1;
    throw err;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  validate(SCHEMA_PATH, raw, `talents/${slug}/talent.json`);

  const defaults = brand.defaults ?? {};
  const availabilityKey = raw.availability ?? "available";

  // hidePhotoの名義では写真自体を出さないので、ファイル不備を警告しても意味が無い
  const warnings = [];
  if (!defaults.hidePhoto) {
    const photoWarning = findPhotoWarning(talentDir, raw.photo);
    if (photoWarning) warnings.push(photoWarning);
  }

  const career = raw.career.map((c) => ({
    period: c.period,
    org: c.org,
    title: c.title ?? null,
    note: c.note ?? null,
    headline: c.headline,
    body: c.body ?? null,
  }));

  const skills = (raw.skills ?? []).map((s) => ({
    group: s.group,
    level: s.level ?? null,
    items: s.items ?? [],
  }));

  const projects = (raw.projects ?? []).map((p) => ({
    name: p.name,
    badge: p.badge ?? null,
    subtitle: p.subtitle ?? null,
    body: p.body ?? null,
    tools: p.tools ?? null,
    featured: p.featured ?? false,
  }));

  const pages = raw.layout?.pages ?? (projects.length > 0 ? PAGES_WITH_PROJECTS : PAGES_WITHOUT_PROJECTS);

  return {
    slug,
    initials: raw.initials,
    role: raw.role,
    issued: raw.issued ?? jstYearMonth(new Date()),
    availability: { key: availabilityKey, label: AVAILABILITY_LABELS[availabilityKey] },
    photoSrc: resolvePhotoSrc(talentDir, raw.photo, defaults.hidePhoto),
    facts: buildFacts(raw, defaults),
    overviewHtml: raw.overview.map((p) => inline(p)),
    // items が空の行は落とす（テンプレート側は talent.coverage.length で節ごと出し分ける）
    coverage: [
      { label: "役割", items: raw.coverage?.roles ?? [] },
      { label: "職種", items: raw.coverage?.jobFields ?? [] },
      { label: "業界", items: raw.coverage?.industries ?? [] },
    ].filter((row) => row.items.length > 0),
    career,
    skills,
    projects,
    // render.mjsが標準出力・reportに使う。テンプレートのtalent.*からは参照しない
    warnings,
    // render.mjsがトップレベルのpagesへ引き上げる。テンプレートのtalent.*からは参照しない
    pages,
  };
}
