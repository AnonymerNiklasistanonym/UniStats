import { Application, TSConfigReader, TypeDocReader, SourceFileMode } from "typedoc";
import { ScriptTarget } from "typescript";
import path from "path";


const app = new Application();

// If you want TypeDoc to load tsconfig.json / typedoc.json files
app.options.addReader(new TSConfigReader());
app.options.addReader(new TypeDocReader());

app.bootstrap({
    mode: SourceFileMode.File,
    target: ScriptTarget.ESNext,
    experimentalDecorators: true,
    ignoreCompilerErrors: false,
    categorizeByGroup: true,
    exclude: [
        "node_modules/**/*",
        "docs/**/*",
        "dist/**/*"
    ],
    name: "UniStats",
    readme: path.join(__dirname, "DOCS_README_TYPEDOC.md")
});

const project = app.convert(app.expandInputFiles(["src"]));

if (project) {
    // Rendered docs
    const outputDir = path.join(__dirname, "dist");
    app.generateDocs(project, outputDir);
} else {
    throw Error("TypeDoc documentation was not successful");
}
