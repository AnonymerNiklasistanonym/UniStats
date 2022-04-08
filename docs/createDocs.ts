import { Application, TSConfigReader, TypeDocReader } from "typedoc";
import path from "path";


const app = new Application();

// If you want TypeDoc to load tsconfig.json / typedoc.json files
app.options.addReader(new TSConfigReader());
app.options.addReader(new TypeDocReader());

app.bootstrap({
    categorizeByGroup: true,
    entryPoints: [
        path.join(__dirname, "..", "src", "index.ts"),
        path.join(__dirname, "..", "src", "createHtmlParts.ts"),
        path.join(__dirname, "..", "src", "getModuleInfos.ts"),
        path.join(__dirname, "..", "src", "util.ts"),
    ],
    exclude: [
        path.join(__dirname, "..", "node_modules/**/*"),
        path.join(__dirname, "..", "docs/**/*"),
        path.join(__dirname, "..", "dist/**/*")
    ],
    name: "UniStats",
    readme: path.join(__dirname, "DOCS_README_TYPEDOC.md")
});

const project = app.convert();

if (project) {
    // Rendered docs
    const outputDir = path.join(__dirname, "dist");
    // eslint-disable-next-line no-console
    app.generateDocs(project, outputDir).then(() => console.log("successful")).catch(err => console.error(err));
} else {
    throw Error("TypeDoc documentation was not successful");
}
