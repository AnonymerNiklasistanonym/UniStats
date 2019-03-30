import * as fs from "fs"
import * as path from "path"
import { UniTemplate, Module, Catalog } from "../templates/uni_template"
import { getCredits, CreditsAndGrade, getExamTryCount } from "./getInfos"
import { HtmlFunction } from "./createHtmlParts"

const demoDataFilePath = path.join(__dirname, "../data/demo.json")
const demoData: UniTemplate = JSON.parse(fs.readFileSync(demoDataFilePath, "utf8"))
console.log(demoData.name.first_name, demoData.name.surname,
    "studying", demoData.field_of_study,
    "in the", demoData.current_semester + "th", "semester")

let creditsGrade = { credits: 0, grade: 0 }
if (demoData.modules !== undefined) {
    const creditsAndGrades = getCredits(demoData.modules)
    const credits = creditsAndGrades.reduce((prev, curr: CreditsAndGrade) => prev + curr.credits, 0)
    const grade = creditsAndGrades.reduce((prev, curr: CreditsAndGrade) => prev + curr.grade * curr.credits, 0.0) / credits
    creditsGrade = {
        credits,
        grade
    }
}

let examSecondTryCount = 0
let examThirdTryCount = 0
if (demoData.modules !== undefined) {
    const examTryCount = getExamTryCount(demoData.modules)
    examSecondTryCount = examTryCount.secondTry
    examThirdTryCount = examTryCount.thirdTry
}

function range(size: number, startAt: number = 0): number[] {
    return [...Array(size).keys()].map(i => i + startAt)
}

function getClassesOfSemesterOfModule(module: Module, semester: number) {
    const classes: string[] = []
    if (module.recommended_semester !== undefined && module.recommended_semester === semester) {
        classes.push("recommended")
    }
    if (module.participated_semesters !== undefined && module.participated_semesters.includes(semester)) {
        classes.push("participated")
    }
    if (module.wrote_exam_semesters !== undefined && module.wrote_exam_semesters.includes(semester)) {
        if (module.wrote_exam_semesters.includes(semester + 1)) {
            classes.push("failed_exam")
        } else {
            classes.push("wrote_exam")
        }
    }
    return classes
}

const tableCssSemesterCell = "<div class=\"a\"></div><div class=\"b\"></div><div class=\"c\"></div>"

const countCellsWithoutSemesters = 3
const countCellsSemester = demoData.current_semester
const semesterList = range(demoData.current_semester, 1)

function createModuleSectionForTable(modules: Module[], title: string) {
    return [
        [{ content: "> " + title, headerCell: true, colSpan: countCellsSemester + countCellsWithoutSemesters }],
        ...modules
            .sort((a, b) => b.credits - a.credits)
            .map(module =>
                [{ content: HtmlFunction.createModuleEntry(module) },
                { content: module.grade !== undefined ? module.grade : "" },
                { content: module.credits },
                ...semesterList.map(semester => (
                    { content: tableCssSemesterCell, classes: getClassesOfSemesterOfModule(module, semester) }
                ))])
    ]
}

function createCatalogSectionsForTable(catalogs: Catalog[], title: string) {
    return [
        [{ content: ">> " + title, headerCell: true, colSpan: countCellsSemester + countCellsWithoutSemesters }],
        ...catalogs
            .sort((a, b) => b.credits - a.credits)
            .map(catalog => createModuleSectionForTable(catalog.modules, `${catalog.name} (${catalog.number})`))
            .reduce((previous, current) => previous.concat(current), [])
    ]
}

const htmlTable = HtmlFunction.createTable(
    [
        [
            { content: "", headerCell: true, colSpan: countCellsWithoutSemesters },
            { content: "Semester", headerCell: true, colSpan: countCellsSemester },
        ],
        [
            { content: "Module", headerCell: true },
            { content: "Grade", headerCell: true },
            { content: "ETCS", headerCell: true },
            ...semesterList.map(semester => ({ content: semester, headerCell: true }))
        ]
    ],
    [
        ...createModuleSectionForTable(demoData.modules.base, "Base modules"),
        ...createModuleSectionForTable(demoData.modules.core, "Core modules"),
        ...createCatalogSectionsForTable(demoData.modules.supplementary, "Supplementary modules"),
        ...createModuleSectionForTable(demoData.modules.key_qualifications, "Key Qualifications")
    ]
)

const htmlTableStats = HtmlFunction.createTable([[]], [
    [
        { content: "Currently accumulated credits" },
        { content: creditsGrade.credits + "/" + demoData.needed_credits + " (" + Math.round(creditsGrade.credits / demoData.needed_credits * 100) + "%)" },
    ], [
        { content: "Currently calculated grade" },
        { content: creditsGrade.grade.toFixed(1) },
    ], [
        { content: "Credits per semester" },
        { content: creditsGrade.credits / countCellsSemester },
    ], [
        { content: "Exam 2nd tries" },
        { content: examSecondTryCount },
    ], [
        { content: "Exam 3rd tries" },
        { content: examThirdTryCount },
    ]
])

const html_document = "<!DOCTYPE html><html><head><style>" + fs.readFileSync(path.join(__dirname, "../templates/default_table_style.css"), "utf8") + "</style></head><body>" +
    "<h2>" + demoData.title + "</h2>" +
    "<h3>" + demoData.name.surname + ", " + demoData.name.first_name + " (" + demoData.field_of_study + ", " + demoData.current_semester + ". semester)</h3>" +
    "<h4>" + new Date().toISOString().slice(0, 10) + "</h4>" +
    htmlTable +
    "<br>" +
    htmlTableStats + "</body></html>"

fs.writeFileSync(path.join(__dirname, "../data/table.html"), html_document)
