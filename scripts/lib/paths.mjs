import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

// scripts/lib/ から見てリポジトリルートは2階層上
export const repoRoot = path.resolve(here, "..", "..");

export const brandDir = path.join(repoRoot, "brand");
export const talentsDir = path.join(repoRoot, "talents");

// 非公開の切り替え。テンプレートがまだ無い間の動作確認用（CLIオプションには出さない）。
export const templateDir = process.env.PTP_TEMPLATE_DIR
  ? path.resolve(process.env.PTP_TEMPLATE_DIR)
  : path.join(repoRoot, "template");
