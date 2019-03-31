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
 * Get the sum of achieved credits of a list of modules
 * @param modules The module list which should be analyzed
 */
function getModuleAchievedCreditSum(modules: Module[]): number {
    return modules.filter((a) => a.grade !== undefined)
        .reduce((sum, currentModule) => sum + currentModule.credits, 0);
}

/**
 * Get the sum of all credits of a list of modules
 * @param modules The module list which should be analyzed
 */
function getModuleCreditSum(modules: Module[]): number {
    return modules.reduce((sum, currentModule) => sum + currentModule.credits,
                          0);
}

/**
 * Get the average of achieved grades of a list of modules
 * @param modules The module list which should be analyzed
 */
function getModuleGradeAverage(modules: Module[]): number {
    const moduleCreditSum: number = getModuleAchievedCreditSum(modules);

    return modules.filter((a) => a.grade !== undefined)
        .reduce((sum, currentModule) => sum +
            // @ts-ignore: Object is possibly 'undefined'
            (currentModule.grade / moduleCreditSum) * currentModule.credits,
                0);
}

/**
 * Get the average of achieved grades of a list of modules
 * @param modules The module list which should be analyzed
 * @param neededCredits Optional needed credits, else the sum is taken
 */
function getProgressOfModuleList(modules: Module[],
                                 neededCredits?: number): string {
    const whole: number = neededCredits !== undefined
        ? neededCredits : getModuleCreditSum(modules);
    const gradeAverage: number = getModuleGradeAverage(modules);
    const creditSum: number = getModuleAchievedCreditSum(modules);
    const progress: IProgressCalculator = progressCalculator(creditSum,
                                                             whole, 0);

    return `Progress: ${progress.achieved}/${progress.whole} (${
        progress.percentage}%), Average grade: ${gradeAverage.toFixed(1)}`;
}

/**
 * Parse modules to a module section HTML table cells
 * @param modules Modules to parse
 * @param title Title of the module section
 */
function createModuleSectionForTable(modules: Module[],
                                     title: string,
                                     progress: boolean = true):
    HtmlFunctions.IHtmlTableCell[][] {
    const progressCells: HtmlFunctions.IHtmlTableCell[][] = progress ? [
        [{
            classes: ["progress"],
            colSpan: semesterCount + tableCellCountWoSem,
            content: getProgressOfModuleList(modules),
        }],
    ] : [];

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
        ...progressCells,
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

    return [
        [{
            colSpan: semesterCount + tableCellCountWoSem,
            content: `>> ${title}`,
            headerCell: true,
        }],
        ...catalogs.sort((a, b) => b.credits - a.credits)
            .filter((a) => a.modules !== undefined)
            .map((catalog) => createModuleSectionForTable(
                // @ts-ignore: Object is possibly 'undefined'
                catalog.modules,
                `${catalog.name} (${catalog.number})`, false)
                .concat([[{
                    colSpan: semesterCount + tableCellCountWoSem,
                    // @ts-ignore: Object is possibly 'undefined'
                    content: getProgressOfModuleList(catalog.modules,
                                                     catalog.credits),
                }]]))
            .reduce((previous, current) => previous.concat(current), []),
    ];
}

/**
 * Contains the credits and grade for each semester
 */
interface IProgressCreditsGradeSemester {
    /**
     * All the achieved credits of the semester
     */
    credits: number;
    /**
     * The achieved grade of the semester
     */
    grade: number;
}

/**
 * Create a semester progress row with some stats
 * @param tableCellOffset The cell number offset to the semesters
 * @param semesterCellCount The semesters that should be looked at
 * @param modules The modules that should be analyzed
 */
function createSemesterProgressRow(tableCellOffset: number,
                                   semesterCellCount: number,
                                   modules: Module[]):
                                   HtmlFunctions.IHtmlTableCell[] {
    const semesters: number[] = range(semesterCellCount, 1);
    const moduleCreditGradeInfo: IModuleCredit[] = getModuleCredits(moduleData);
    const semesterStats: string[] = semesters.map((semester) => {
        const semesterModules: IModuleCredit[] = moduleCreditGradeInfo
            .filter((moduleInfo) => moduleInfo.grade !== undefined)
            .filter((moduleInfo) => moduleInfo.semester !== undefined)
            .filter((moduleInfo) => moduleInfo.semester === semester);
        const creditSumSemester: number = semesterModules
            .reduce((sum, currentModule) => sum + currentModule.credits, 0);
        const credGradeProg: IProgressCreditsGradeSemester = semesterModules
            .reduce((result: IProgressCreditsGradeSemester,
                     currentModuleInfo) => ({
                credits: result.credits + currentModuleInfo.credits,
                grade: result.grade +
                    // @ts-ignore: Object is possibly 'undefined'
                    (currentModuleInfo.grade / creditSumSemester) *
                    currentModuleInfo.credits,
                }), { credits: 0, grade: 0 });

        return `${credGradeProg.credits}/${credGradeProg.grade.toFixed(1)}`;
    });

    return [
        { content: "", colSpan: tableCellOffset },
        ...semesterStats.map((progressString) => ({ content: progressString })),
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
        createSemesterProgressRow(tableCellCountWoSem, semesterCount,
                                  moduleData),
    ],
);

const creditProgress: IProgressCalculator =
    progressCalculator(credits, demoData.needed_credits, 0);
const htmlTableStats: string = HtmlFunctions.createTable([[]], [
    [
        { content: "Currently accumulated credits" },
        {
            content: `${creditProgress.achieved}/${creditProgress.whole} (${
                creditProgress.percentage}%)`,
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
    demoData.name.surname}, ${demoData.name.first_name} - ${
    demoData.matriculation_number} (${demoData.field_of_study}, ${
    demoData.current_semester}. semester)</h3><h4>${currentIsoDateString}</h4>${
    htmlTable}<br>${htmlTableStats}</body></html>`;

fs.writeFileSync(path.join(__dirname, "../data/table.html"), htmlDocument);
