import { compileFromFile } from "json-schema-to-typescript"
import * as fs from "fs"
import * as path from "path"

const jsonSchemaFilePath = path.join(__dirname, "uni_template.json")
const outputFilePath = path.join(__dirname, "uni_template.ts")

compileFromFile(jsonSchemaFilePath)
    .then(ts => fs.writeFileSync(outputFilePath, ts))
