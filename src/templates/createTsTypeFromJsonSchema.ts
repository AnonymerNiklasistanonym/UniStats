import { promises as fs } from "fs";
import { compileFromFile } from "json-schema-to-typescript";
import * as path from "path";

const jsonSchemaFilePath = path.join(__dirname, "uni_template.json");
const outputFilePath = path.join(__dirname, "uni_template.ts");

compileFromFile(jsonSchemaFilePath)
    .then(ts => fs.writeFile(outputFilePath, "/* eslint-disable */\n" + ts))
    // eslint-disable-next-line no-console
    .catch(console.error);
