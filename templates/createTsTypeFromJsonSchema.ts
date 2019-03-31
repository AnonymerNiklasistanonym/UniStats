import * as fs from "fs";
import { compileFromFile } from "json-schema-to-typescript";
import * as path from "path";

const jsonSchemaFilePath: string = path.join(__dirname, "uni_template.json");
const outputFilePath: string = path.join(__dirname, "uni_template.ts");

compileFromFile(jsonSchemaFilePath)
    .then((ts) => { fs.writeFileSync(outputFilePath, ts); })
    .catch((error) => { console.error(error); });
