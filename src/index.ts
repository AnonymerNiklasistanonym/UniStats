import * as fs from "fs";
import * as path from "path";

import {
    Catalog,
    Module,
    UniTemplate,
} from "../templates/uni_template";

import * as HtmlFunctions from "./createHtmlParts";
import {
    getModuleCredits,
    getModuleExamTries,
    getModules,
    IModuleCredit,
    IModuleExamTries,
    IModuleWithInfo,
} from "./getModuleInfos";
import {
    IProgressCalculator,
    progressCalculator,
    range,
} from "./util";

const demoDataFilePath: string = path.join(__dirname, "../data/demo.json");
const customDataFilePath: string = path.join(__dirname, "../data/uni.json");

const demoData: UniTemplate = JSON.parse(fs.readFileSync(
    fs.existsSync(customDataFilePath) ? customDataFilePath : demoDataFilePath,
    "utf8")) as UniTemplate;

if (demoData.modules === undefined) {
    throw Error("This only works if you have some modules defined");
}

const moduleData: IModuleWithInfo[] = getModules(demoData.modules);
const moduleDataCredits: IModuleCredit[] = getModuleCredits(moduleData);
const moduleDataExamTries: IModuleExamTries[] = getModuleExamTries(moduleData);

const credits: number = moduleDataCredits.filter((a) => a.grade !== undefined)
    .reduce((prev, curr) => prev + curr.credits, 0);
const grade: number = moduleDataCredits.filter((a) => a.grade !== undefined)
    // @ts-ignore: Object is possibly 'undefined'
    .reduce((prev, curr) => prev + (curr.grade / credits) * curr.credits, 0);

export interface IExamTryCount {
    /**
     * Exam count that was tried once
     */
    one: number;
    /**
     * Exam count that was tried three times
     */
    three: number;
    /**
     * Exam count that was tried twice
     */
    two: number;
}

const EXAM_TRY_COUNT_ONE: number = 1;
const EXAM_TRY_COUNT_TWO: number = 2;
const EXAM_TRY_COUNT_THREE: number = 3;
const examTryCount: IExamTryCount = {
    one: moduleDataExamTries
        .filter((module) => module.tries === EXAM_TRY_COUNT_ONE).length,
    three: moduleDataExamTries
        .filter((module) => module.tries === EXAM_TRY_COUNT_THREE).length,
    two: moduleDataExamTries
        .filter((module) => module.tries === EXAM_TRY_COUNT_TWO).length,
};

/**
 * Determine classes of a semester of a module
 * @param module Module which should be checked
 * @param semester Semester which should be checked
 */
function getClassesOfSemesterOfModule(module: Module,
    semester: number): string[] {
    const classes: string[] = [];
    if (module.recommended_semester !== undefined &&
        module.recommended_semester === semester) {
        classes.push("recommended");
    }
    if (module.participated_semesters !== undefined &&
        module.participated_semesters.includes(semester)) {
        classes.push("participated");
    }
    if (module.wrote_exam_semesters !== undefined &&
        module.wrote_exam_semesters.includes(semester)) {
        if (module.wrote_exam_semesters.includes(semester + 1)) {
            classes.push("failed_exam");
        } else {
            classes.push("wrote_exam");
        }
    }

    return classes;
}

const tableCssSemesterCell: string =
    "<div class=\"a\"></div><div class=\"b\"></div><div class=\"c\"></div>";
const tableCellCountWoSem: number = 3;
const semesterCount: number = demoData.current_semester;
const semesterList: number[] = range(semesterCount, 1);

/**
 * Parse modules to a module section HTML table cells
 * @param modules Modules to parse
 * @param title Title of the module section
 */
function createModuleSectionForTable(modules: Module[],
    title: string):
    HtmlFunctions.IHtmlTableCell[][] {
    // TODO Add progress calculator

    return [
        [{
            colSpan: semesterCount + tableCellCountWoSem,
            content: `> ${title}`,
            headerCell: true,
        }],
        ...modules
            .sort((a, b) => b.credits - a.credits)
            .map((module) =>
                [{ content: HtmlFunctions.createModuleEntry(module) },
                { content: module.grade !== undefined ? module.grade : "" },
                { content: module.credits },
                ...semesterList.map((semester) => ({
                    classes: getClassesOfSemesterOfModule(module, semester),
                    content: tableCssSemesterCell,
                }))]),
        [{
            classes: ["progress"],
            colSpan: semesterCount + tableCellCountWoSem,
            content: "Progress: TODO",
        }],
    ];
}

/**
 * Parse catalogs to a catalog section HTML table cells
 * @param catalogs Catalogs to parse
 * @param title Title of the catalog section
 */
function createCatalogSectionsForTable(catalogs: Catalog[],
    title: string):
    HtmlFunctions.IHtmlTableCell[][] {
    // TODO Add progress calculator

    return [
        [{
            colSpan: semesterCount + tableCellCountWoSem,
            content: `>> ${title}`,
            headerCell: true,
        }],
        ...catalogs
            .sort((a, b) => b.credits - a.credits)
            .filter((a) => a.modules !== undefined)
            .map((catalog) => createModuleSectionForTable(
                // @ts-ignore: Object is possibly 'undefined'
                catalog.modules,
                `${catalog.name} (${catalog.number})`))
            .reduce((previous, current) => previous.concat(current), []),
    ];
}

const htmlTable: string = HtmlFunctions.createTable(
    [
        [
            { content: "", headerCell: true, colSpan: tableCellCountWoSem },
            { content: "Semester", headerCell: true, colSpan: semesterCount },
        ],
        [
            { content: "Module", headerCell: true },
            { content: "Grade", headerCell: true },
            { content: "ETCS", headerCell: true },
            ...semesterList
                .map((semester) => ({ content: semester, headerCell: true })),
        ],
    ],
    [
        ...createModuleSectionForTable(demoData.modules.base, "Base modules"),
        ...createModuleSectionForTable(demoData.modules.core, "Core modules"),
        ...createCatalogSectionsForTable(demoData.modules.supplementary,
            "Supplementary modules"),
        ...createModuleSectionForTable(demoData.modules.key_qualifications,
            "Key Qualifications"),
    ],
);

const creditProgress: IProgressCalculator =
    progressCalculator(credits, demoData.needed_credits, 1);
const htmlTableStats: string = HtmlFunctions.createTable([[]], [
    [
        { content: "Currently accumulated credits" },
        {
            content: `${creditProgress.achieved}/${creditProgress.whole} (${
                creditProgress.percentage}%)`
        },
    ],
    [
        { content: "Currently calculated grade" },
        { content: grade.toFixed(1) },
    ],
    [
        { content: "Credits per semester" },
        { content: credits / semesterCount },
    ],
    [
        { content: "Exam 2nd tries" },
        { content: examTryCount.two },
    ],
    [
        { content: "Exam 3rd tries" },
        { content: examTryCount.three },
    ],
]);

const cssFilePath: string = path
    .join(__dirname, "../templates/default_table_style.css");
const cssContent: string = fs.readFileSync(cssFilePath, "utf8");
const ISO_DATE_LENGTH: number = 10;
const currentIsoDateString: string = new Date().toISOString()
    .slice(0, ISO_DATE_LENGTH);
const htmlDocument: string = `<!DOCTYPE html><html><head><style>${cssContent
    }</style></head><body><h2>${demoData.title}</h2><h3>${
    demoData.name.surname}, ${demoData.name.first_name} (${
    demoData.field_of_study}, ${demoData.current_semester
    }. semester)</h3><h4>${currentIsoDateString}</h4>${
    htmlTable}<br>${htmlTableStats}</body></html>`;

fs.writeFileSync(path.join(__dirname, "../data/table.html"), htmlDocument);
