// talent.json の overview 等に使う、ごく限定的なインライン記法だけを解釈する。
// 対応するのは太字(**x**)と改行のみ。

export function inline(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  return bolded.replace(/\n/g, "<br>");
}
