import * as fs from "fs";
import * as path from "path";

import * as UniTemplate from "./templates/uni_template";
import * as HtmlFunctions from "./createHtmlParts";
import * as ModuleInfo from "./getModuleInfos";
import * as util from "./util";

const demoDataFilePath: string = path.join(__dirname, "..", "data", "demo.json");
const customDataFilePath: string = path.join(__dirname, "..", "data", "uni.json");

const demoData = JSON.parse(fs.readFileSync(
    fs.existsSync(customDataFilePath) ? customDataFilePath : demoDataFilePath,
    "utf8")) as UniTemplate.UniTemplate;

if (!(demoData.module_groups.some((a) => a.modules !== undefined) ||
    demoData.module_groups.some((a) => a.catalogs !== undefined))) {
    throw Error("This only works if you have some modules defined");
}

const moduleData: ModuleInfo.ModuleWithInfo[] = ModuleInfo.getModules(demoData.module_groups);
const moduleDataCredits: ModuleInfo.ModuleCredit[] = ModuleInfo.getModuleCredits(moduleData);
const moduleDataExamTries: ModuleInfo.ModuleExamTries[] = ModuleInfo.getModuleExamTries(moduleData);

const credits: number = moduleDataCredits.filter((a) => a.grade !== undefined)
    .reduce((prev, curr) => prev + curr.credits, 0);
const grade: number = moduleDataCredits.filter((a) => a.grade !== undefined)
    .reduce((prev, curr) => prev + ((curr.grade ? curr.grade : 0) / credits) * curr.credits, 0);

export interface ExamTryCount {
    /**
     * Exam count that was tried once
     */
    one: number
    /**
     * Exam count that was tried three times
     */
    three: number
    /**
     * Exam count that was tried twice
     */
    two: number
}

const EXAM_TRY_COUNT_ONE = 1;
const EXAM_TRY_COUNT_TWO = 2;
const EXAM_TRY_COUNT_THREE = 3;
const examTryCount: ExamTryCount = {
    one: moduleDataExamTries
        .filter((module) => module.tries === EXAM_TRY_COUNT_ONE).length,
    three: moduleDataExamTries
        .filter((module) => module.tries === EXAM_TRY_COUNT_THREE).length,
    two: moduleDataExamTries
        .filter((module) => module.tries === EXAM_TRY_COUNT_TWO).length
};

/**
 * Determine classes of a semester of a module
 * @param module Module which should be checked
 * @param semester Semester which should be checked
 */
// eslint-disable-next-line complexity
const getClassesOfSemesterOfModule = (module: UniTemplate.Module,semester: number): string[] => {
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
};

const tableCssSemesterCell =
    "<div class=\"a\"></div><div class=\"b\"></div><div class=\"c\"></div>";
const tableCellCountWoSem = 3;
const semesterCount: number = demoData.current_semester;
const semesterList: number[] = util.range(semesterCount, 1);

/**
 * Get the sum of achieved credits of a list of modules
 * @param modules The module list which should be analyzed
 */
const getModuleAchievedCreditSum = (modules: UniTemplate.Module[]): number =>
    modules
        .filter((a) => a.grade !== undefined)
        .reduce((sum, currentModule) => sum + currentModule.credits, 0);

/**
 * Get the sum of all credits of a list of modules
 * @param modules The module list which should be analyzed
 */
const getModuleCreditSum = (modules: UniTemplate.Module[]): number =>
    modules.reduce((sum, currentModule) => sum + currentModule.credits, 0);

/**
 * Get the average of achieved grades of a list of modules
 * @param modules The module list which should be analyzed
 */
const getModuleGradeAverage = (modules: UniTemplate.Module[]): number => {
    const moduleCreditSum: number = getModuleAchievedCreditSum(modules);

    return modules.filter((a) => a.grade !== undefined)
        .reduce((sum, currentModule) => sum +
            ((currentModule.grade ? currentModule.grade : 0) / moduleCreditSum) * currentModule.credits,
        0);
};

/**
 * Get the average of achieved grades of a list of modules
 * @param modules The module list which should be analyzed
 * @param neededCredits Optional needed credits, else the sum is taken
 */
const getProgressOfModuleList = (modules: UniTemplate.Module[], neededCredits?: number): string => {
    const whole = neededCredits !== undefined
        ? neededCredits : getModuleCreditSum(modules);
    const gradeAverage = getModuleGradeAverage(modules);
    const creditSum = getModuleAchievedCreditSum(modules);
    const progress = util.progressCalculator(creditSum, whole, 0);

    return `Progress: ${progress.achieved}/${progress.whole} (${
        progress.percentage}%), Average grade: ${gradeAverage.toFixed(1)}`;
};

/**
 * Parse module to a row of HTML table cells
 * @param module Modules to parse
 */
const createModuleRowForTable = (module: UniTemplate.Module): HtmlFunctions.HtmlTableCell[] =>
    [
        { content: HtmlFunctions.createModuleEntry(module) },
        { content: module.grade !== undefined ? module.grade : "" },
        { content: module.credits },
        ...semesterList.map((semester) => ({
            classes: getClassesOfSemesterOfModule(module, semester),
            content: tableCssSemesterCell
        }))
    ];

/**
 * Parse catalogs to a catalog section HTML table cells
 * @param catalogs Catalogs to parse
 * @param title Title of the catalog section
 */
const createCatalogSectionsForTable = (catalog: UniTemplate.Catalog,
    progress = true): HtmlFunctions.HtmlTableCell[][] => {
    const modules: UniTemplate.Module[] = catalog.modules !== undefined
        ? catalog.modules : [];
    const progressCells: HtmlFunctions.HtmlTableCell[][] = progress ? [
        [{
            classes: ["progress", "module_group_catalog"],
            colSpan: semesterCount + tableCellCountWoSem,
            content: getProgressOfModuleList(modules, catalog.credits)
        }]
    ] : [];

    return [
        [{
            colSpan: semesterCount + tableCellCountWoSem,
            content: `>> ${catalog.name} (${catalog.number})`,
            headerCell: true
        }],
        ...modules.map(createModuleRowForTable),
        ...progressCells
    ];
};

/**
 * Parse modules to a module section HTML table cells
 * @param modules Modules to parse
 * @param title Title of the module section
 */
const createModuleGroupSectionForTable = (moduleGroup: UniTemplate.ModuleGroup,
    progress = true): HtmlFunctions.HtmlTableCell[][] => {
    const modules: ModuleInfo.ModuleWithInfo[] = ModuleInfo.getModules([ moduleGroup ]);
    const neededCredits: number = (moduleGroup.catalogs !== undefined ?
        moduleGroup.catalogs.reduce((sum, catalog) => sum + catalog.credits, 0)
        : 0) + (modules.filter((module) => module.info.catalog === undefined)
        .reduce((sum, module) => sum + module.credits, 0));
    const progressCells: HtmlFunctions.HtmlTableCell[][] = progress ? [
        [{
            classes: ["progress", "module_group"],
            colSpan: semesterCount + tableCellCountWoSem,
            content: getProgressOfModuleList(modules, neededCredits)
        }]
    ] : [];
    const catalogs: HtmlFunctions.HtmlTableCell[][][] = (moduleGroup.catalogs !== undefined)
        ? moduleGroup.catalogs
            .sort((a, b) => b.credits - a.credits)
            .map((catalog) => createCatalogSectionsForTable(catalog, progress))
        : [[]];

    return [
        [{
            colSpan: semesterCount + tableCellCountWoSem,
            content: `> ${moduleGroup.name}`,
            headerCell: true
        }],
        ...modules
            // Remove all catalog modules
            .filter((a) => a.info.catalog === undefined)
            .sort((a, b) => b.credits - a.credits)
            .map(createModuleRowForTable),
        ...util.flattenArray(catalogs),
        ...progressCells
    ];
};

/**
 * Contains the credits and grade for each semester
 */
interface ProgressCreditsGradeSemester {
    /**
     * All the achieved credits of the semester
     */
    credits: number
    /**
     * The achieved grade of the semester
     */
    grade: number
}

/**
 * Create a semester progress row with some stats
 * @param tableCellOffset The cell number offset to the semesters
 * @param semesterCellCount The semesters that should be looked at
 * @param modules The modules that should be analyzed
 */
const createSemesterProgressRow = (tableCellOffset: number,
    semesterCellCount: number /* , modules: UniTemplate.Module[] */): HtmlFunctions.HtmlTableCell[] => {
    const semesters = util.range(semesterCellCount, 1);
    const moduleCreditGradeInfo = ModuleInfo.getModuleCredits(moduleData);
    const semesterStats: string[] = semesters.map((semester) => {
        const semesterModules = moduleCreditGradeInfo
            .filter((moduleInfo) => moduleInfo.grade !== undefined)
            .filter((moduleInfo) => moduleInfo.semester !== undefined)
            .filter((moduleInfo) => moduleInfo.semester === semester);
        const creditSumSemester = semesterModules
            .reduce((sum, currentModule) => sum + currentModule.credits, 0);
        const creditSumAllSemester = moduleData
            .filter((moduleInfo) => moduleInfo.participated_semesters !== undefined
                && moduleInfo.participated_semesters.includes(semester))
            .reduce((sum, currentModule) => sum + currentModule.credits, 0);
        const credGradeProg: ProgressCreditsGradeSemester = semesterModules
            .reduce((result: ProgressCreditsGradeSemester,
                currentModuleInfo) => ({
                credits: result.credits + currentModuleInfo.credits,
                grade: result.grade + ((currentModuleInfo.grade ? currentModuleInfo.grade : 0) / creditSumSemester) *
                    currentModuleInfo.credits
            }), { credits: 0, grade: 0 });

        return `${credGradeProg.credits}/${credGradeProg.grade.toFixed(1)}` +
               `<br>from: ${creditSumAllSemester}` ;
    });

    return [
        { content: "", colSpan: tableCellOffset },
        ...semesterStats.map((progressString) => ({ content: progressString }))
    ];
};

const htmlTable: string = HtmlFunctions.createTable(
    [
        [
            { content: "", headerCell: true, colSpan: tableCellCountWoSem },
            { content: "Semester", headerCell: true, colSpan: semesterCount }
        ],
        [
            { content: "Module", headerCell: true },
            { content: "Grade", headerCell: true },
            { content: "ETCS", headerCell: true },
            ...semesterList
                .map((semester) => ({ content: semester, headerCell: true }))
        ]
    ],
    [
        ...util.flattenArray(demoData.module_groups.map((moduleGroup) =>
            createModuleGroupSectionForTable(moduleGroup, true))),
        createSemesterProgressRow(tableCellCountWoSem, semesterCount /* , moduleData */)
    ]
);

const creditProgress = util.progressCalculator(credits, demoData.needed_credits, 0);
const htmlTableStats: string = HtmlFunctions.createTable([[]], [
    [
        { content: "Currently accumulated credits" },
        {
            content: `${creditProgress.achieved}/${creditProgress.whole} (${
                creditProgress.percentage}%)`
        }
    ],
    [
        { content: "Currently calculated grade" },
        { content: grade.toFixed(1) }
    ],
    [
        { content: "Credits per semester" },
        { content: credits / semesterCount }
    ],
    [
        { content: "Exam 2nd tries" },
        { content: examTryCount.two }
    ],
    [
        { content: "Exam 3rd tries" },
        { content: examTryCount.three }
    ]
]);

const cssFilePath: string = path
    .join(__dirname, "..", "styles", "default_table_style.css");
const cssContent: string = fs.readFileSync(cssFilePath, "utf8")
    .replace(/(?:\r\n|\r|\n|\s)/g, "");
const ISO_DATE_LENGTH = 10;
const currentIsoDateString: string = new Date().toISOString()
    .slice(0, ISO_DATE_LENGTH);
const htmlDocument = `<!DOCTYPE html><html><head><style>${cssContent
}</style><meta charset="UTF-8"></head><body><h2>${demoData.title}</h2><h3>${
    demoData.name.surname}, ${demoData.name.first_name} - ${
    demoData.matriculation_number} (${demoData.field_of_study}, ${
    demoData.current_semester}. semester)</h3><h4>${currentIsoDateString}</h4>${
    htmlTable}<br>${htmlTableStats}</body></html>`;

const tableFilePath: string = path.join(__dirname, "..", "data", "table.html");
fs.writeFileSync(tableFilePath, htmlDocument);

// eslint-disable-next-line no-console
console.info(`HTML table was written to '${tableFilePath}'`);
