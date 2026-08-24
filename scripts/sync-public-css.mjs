import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "public", "ttn.css");
const inputFile = join(root, "app", "globals.css");

async function compileFromSource() {
  const css = readFileSync(inputFile, "utf8");
  const result = await postcss([tailwind()]).process(css, { from: inputFile, to: outFile });
  return result.css;
}

function copyFromNextBuild() {
  const chunks = join(root, ".next", "static", "chunks");
  if (!existsSync(chunks)) return "";
  return readdirSync(chunks)
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(join(chunks, file), "utf8"))
    .join("\n");
}

const compiled = await compileFromSource().catch((error) => {
  console.warn("Tailwind compile failed, trying Next build CSS:", error.message);
  return "";
});
const css = compiled.trim() ? compiled : copyFromNextBuild();
if (!css.trim()) {
  console.error("Could not build public/ttn.css");
  process.exit(1);
}

mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(outFile, css);
console.log(`Wrote ${outFile} (${css.length} bytes)`);
