import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import openapiTS, { astToString } from "openapi-typescript";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { format } from "prettier";

const check = process.argv.includes("--check");
async function sourceDigest() {
  const files = ["app/main.py", "uv.lock"];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory() && entry.name !== "__pycache__") await visit(file);
      else if (entry.isFile() && entry.name.endsWith(".py")) files.push(file);
    }
  }
  await visit("app/api");
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(file + "\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}
const digest = await sourceDigest();
let schema;
if (process.argv.includes("--from-snapshot")) {
  schema = JSON.parse(await readFile("schemas/openapi.json", "utf8"));
  if (schema["x-oma-contract-sources"] !== digest)
    throw new Error("Backend contract sources changed; run npm run api:generate");
} else {
  const result = spawnSync("uv", ["run", "python", "-m", "app.api.export_schema"], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Isolated OpenAPI export failed: ${result.stderr}`);
  schema = JSON.parse(result.stdout);
  schema["x-oma-contract-sources"] = digest;
}
const schemas = schema.components.schemas;
const identifier = (name) => `validate${name.replace(/[^a-zA-Z0-9_]/g, "_")}`;
const id = (name) => `urn:oma:api:${name}`;
function validationSchema(value) {
  if (Array.isArray(value)) return value.map(validationSchema);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "discriminator")
        .map(([key, entry]) => [
          key,
          key === "$ref" && entry.startsWith("#/components/schemas/")
            ? id(entry.slice("#/components/schemas/".length))
            : validationSchema(entry),
        ]),
    );
  return value;
}
const ajv = new Ajv2020({ strict: false, logger: false, code: { source: true, esm: true }, validateFormats: false });
for (const [name, body] of Object.entries(schemas)) ajv.addSchema({ ...validationSchema(body), $id: id(name) });
const responseNames = new Set(["StreamEnvelope", "PiMessage"]);
const responses = {};
for (const [path, item] of Object.entries(schema.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    if (!operation.responses) continue;
    for (const [status, response] of Object.entries(operation.responses)) {
      if (!status.startsWith("2")) continue;
      const ref = response.content?.["application/json"]?.schema?.$ref;
      if (!ref) continue;
      const name = ref.slice("#/components/schemas/".length);
      responseNames.add(name);
      responses[`${method.toUpperCase()} ${path} ${status}`] = identifier(name);
    }
  }
}
const names = [...responseNames].sort();
for (const name of names) ajv.getSchema(id(name));
const validators =
  standaloneCode(ajv, Object.fromEntries(names.map((name) => [identifier(name), id(name)]))) +
  `\nexport const responseValidators = Object.freeze({\n${Object.entries(responses)
    .map(([key, value]) => `${JSON.stringify(key)}:${value}`)
    .join(",\n")}\n});\n`;
const declarations = `import type {components} from "./api";\n${names.map((name) => `export declare function ${identifier(name)}(value:unknown): value is components["schemas"][${JSON.stringify(name)}];`).join("\n")}\nexport declare const responseValidators: Readonly<Record<string, ((value:unknown)=>boolean)|undefined>>;\n`;
const files = {
  "schemas/openapi.json": JSON.stringify(schema, null, 2) + "\n",
  "frontend/src/generated/api.d.ts": await format(
    astToString(await openapiTS(schema, { silent: true, defaultNonNullable: false })),
    { parser: "typescript", printWidth: 120 },
  ),
  "frontend/src/generated/validators.mjs": validators,
  "frontend/src/generated/validators.d.mts": await format(declarations, { parser: "typescript", printWidth: 120 }),
};
for (const [file, content] of Object.entries(files)) {
  if (check) {
    const existing = await readFile(resolve(file), "utf8").catch(() => "");
    if (existing !== content) throw new Error(`API contract drift in ${file}; run npm run api:generate`);
  } else {
    await mkdir(dirname(resolve(file)), { recursive: true });
    await writeFile(resolve(file), content);
  }
}
console.log(check ? "API contracts are current" : "Generated API types and standalone response validators");
