// 色の計算ユーティリティ。HEXの解釈・混色・コントラスト比のみを扱う。
// ブランド固有の既定値は brand.mjs 側に置く。

export function parseHex(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex).trim());
  if (!m) throw new Error(`不正なHEXカラーです: ${hex}`);
  const n = m[1];
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }) {
  const c = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

// t=0でa、t=1でbになる線形補間
export function mix(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

// hexをamountの割合だけ黒に近づける（amount=0.18なら18%暗く）
export function darken(hex, amount) {
  return mix(hex, "#000000", amount);
}

function channelLuminance(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(hexA, hexB) {
  const la = luminance(hexA);
  const lb = luminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

const COLOR_DEFAULTS = {
  ink: "#1A1A1A",
  body: "#3C3C3C",
  muted: "#8A8A8A",
  hairline: "#D9D9D9",
  paper: "#FFFFFF",
};

// brand.jsonのcolorsを受け取り、テンプレートに渡す完全なパレットを作る
export function deriveColors(colors) {
  const accent = toHex(parseHex(colors.accent));
  const ink = colors.ink ?? COLOR_DEFAULTS.ink;
  const body = colors.body ?? COLOR_DEFAULTS.body;
  const muted = colors.muted ?? COLOR_DEFAULTS.muted;
  const hairline = colors.hairline ?? COLOR_DEFAULTS.hairline;
  const paper = colors.paper ?? COLOR_DEFAULTS.paper;

  const accentDark = colors.accentDark ?? darken(accent, 0.18);
  const tint = colors.tint ?? mix(paper, accent, 0.08);

  // accentTextの指定があればコントラスト補正はせずそのまま使う（気に入らない自動補正の逃げ道）
  let accentText;
  if (colors.accentText) {
    accentText = toHex(parseHex(colors.accentText));
  } else {
    accentText = accent;
    let i = 0;
    while (contrastRatio(accentText, paper) < 4.5 && i < 30) {
      accentText = darken(accentText, 0.04);
      i += 1;
    }
  }

  return { accent, accentDark, accentText, tint, ink, body, muted, hairline, paper };
}
