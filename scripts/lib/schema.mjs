import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ajv = new Ajv2020({ allErrors: true, useDefaults: false, strict: false });
addFormats(ajv);

// 同じ$idのスキーマをajv.compileへ複数回渡すと衝突するため、schemaPathごとにキャッシュする
const validators = new Map();

function getValidator(schemaPath) {
  let fn = validators.get(schemaPath);
  if (!fn) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    fn = ajv.compile(schema);
    validators.set(schemaPath, fn);
  }
  return fn;
}

export function validate(schemaPath, data, label) {
  const validateFn = getValidator(schemaPath);
  const ok = validateFn(data);
  if (ok) return data;

  const details = (validateFn.errors ?? []).map((e) => ({
    instancePath: e.instancePath || "(root)",
    message: e.message,
  }));
  const lines = details.map((d) => `${d.instancePath}: ${d.message}`);
  const err = new Error(`${label}の検証に失敗しました:\n${lines.join("\n")}`);
  err.exitCode = 1;
  err.details = details;
  throw err;
}
