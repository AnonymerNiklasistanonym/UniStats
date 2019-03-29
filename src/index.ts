import * as fs from "fs"
import * as path from "path"
import { UniTemplate } from "../templates/uni_template"

const demoDataFilePath = path.join(__dirname, "../data/demo.json")
const demoData: UniTemplate = JSON.parse(fs.readFileSync(demoDataFilePath, "utf8"))
console.log(demoData)
console.log(demoData.name.first_name, demoData.name.surname,
    "studying", demoData.field_of_study,
    "in the", demoData.current_semester + "th", "semester")
