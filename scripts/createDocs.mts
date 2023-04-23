/* eslint-disable no-console */

// Package imports
import { Application, TSConfigReader, TypeDocReader } from "typedoc";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Application();

app.options.addReader(new TSConfigReader());
app.options.addReader(new TypeDocReader());

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const docsDir = path.join(rootDir, "docs");
const outputDir = path.join(docsDir, "dist");
const demoData = await fs.readFile(path.join(dataDir, "demo.json"));

const readmeContent = [
  await fs.readFile(path.join(rootDir, "README.md")),
  await fs.readFile(path.join(docsDir, "README_TYPEDOC_CONTENT.md")),
]
  .map((a) => a.toString())
  .concat(
    "```json\n" +
      JSON.stringify(JSON.parse(demoData.toString()), undefined, 4) +
      "\n```\n"
  )
  .join("\n");
const readme = path.join(docsDir, "README_TYPEDOC.md");
await fs.writeFile(readme, readmeContent);

app.bootstrap({ readme });

const project = app.convert();

if (project) {
  try {
    await app.generateDocs(project, outputDir);
  } catch (err) {
    console.error(err);
  }
} else {
  throw Error("Documentation generation was not successful");
}
