// talents/<slug> や --brand などで受け取るslugの形式検証。パストラバーサル防止も兼ねる。

const SLUG_RE = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

export function assertSlug(slug) {
  const ok = typeof slug === "string" && SLUG_RE.test(slug) && !slug.includes("..");
  if (!ok) {
    const err = new Error(`slug が不正です: ${slug}（英数字と _ - . のみ）`);
    err.exitCode = 1;
    throw err;
  }
}
