import { promises as fs } from "fs";
import * as path from "path";
import { performance } from "perf_hooks";

import * as UniTemplate from "./templates/uni_template";
import * as HtmlFunctions from "./createHtmlParts";
import * as ModuleInfo from "./getModuleInfos";
import * as util from "./util";


const dataDirectory = path.join(__dirname, "..", "data");

/** Input file path to demo data file */
const inputDemoDataFilePath = path.join(dataDirectory, "demo.json");
/** Input file path to custom data file */
const inputJsonCustomDataFilePath = path.join(dataDirectory, "uni.json");

/** Input file path to CSS file path */
const inputCssFilePath: string = path.join(__dirname, "..", "styles", "default_table_style.css");

/** Output HTML file path */
const outputHtmlFilePath = path.join(dataDirectory, "table.html");


(async (): Promise<void> => {

    // Check if there is a custom data file
    const dataFilePath = await util.fileExists(inputJsonCustomDataFilePath)
        ? inputJsonCustomDataFilePath : inputDemoDataFilePath;
    const data = JSON.parse(await fs.readFile(dataFilePath, "utf8")) as UniTemplate.UniTemplate;
    if (!(data.module_groups.some((a) => a.modules !== undefined) ||
    data.module_groups.some((a) => a.catalogs !== undefined))) {
        throw Error("This only works if you have some modules defined");
    }

    // Get ISO date
    const ISO_DATE_LENGTH = 10;
    const currentIsoDateString: string = new Date().toISOString().slice(0, ISO_DATE_LENGTH);

    const moduleData: ModuleInfo.ModuleWithInfo[] = ModuleInfo.getModules(data.module_groups);
    const moduleDataCredits: ModuleInfo.ModuleCredit[] = ModuleInfo.getModuleCredits(moduleData);
    const moduleDataExamTries: ModuleInfo.ModuleExamTries[] = ModuleInfo.getModuleExamTries(moduleData);

    const credits: number = moduleDataCredits.filter((a) => a.grade !== undefined)
        .reduce((prev, curr) => prev + curr.credits, 0);
    const grade: number = moduleDataCredits.filter((a) => a.grade !== undefined)
        .reduce((prev, curr) => prev + ((curr.grade ? curr.grade : 0) / credits) * curr.credits, 0);

    interface ExamTryCount {
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

    const tableCssSemesterCell = "<div class=\"a\"></div><div class=\"b\"></div><div class=\"c\"></div>";
    const tableCellCountWoSem = 3;
    const semesterCount: number = data.current_semester;
    const semesterList: number[] = util.range(semesterCount, 1);

    /**
     * Get the average of achieved grades of a list of modules
     * @param modules The module list which should be analyzed
     * @param neededCredits Optional needed credits, else the sum is taken
     */
    const getProgressOfModuleList = (modules: UniTemplate.Module[], neededCredits?: number): string => {
        const whole = neededCredits !== undefined
            ? neededCredits : ModuleInfo.getModuleCreditSum(modules);
        const gradeAverage = ModuleInfo.getModuleGradeAverage(modules);
        const creditSum = ModuleInfo.getModuleAchievedCreditSum(modules);
        const progress = util.progressCalculator(creditSum, whole, 0);

        return `Progress: ${progress.achieved}/${progress.whole} (${
            progress.percentage}%), Average grade: ${parseFloat(gradeAverage.toFixed(1))}`;
    };

    /**
     * Parse module to a row of HTML table cells
     * @param module Modules to parse
     */
    const createModuleRowForTable = (module: UniTemplate.Module): HtmlFunctions.HtmlTableCell[] =>
        [
            { content: HtmlFunctions.createModuleEntry(module) },
            { content: module.grade !== undefined ? `${module.grade}` : "" },
            { content: `${module.credits}` },
            ...semesterList.map((semester) => ({
                classes: ModuleInfo.getClassesOfSemesterOfModule(module, semester),
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
    const createSemesterProgressRows = (tableCellOffset: number,
        semesterCellCount: number /* , modules: UniTemplate.Module[] */): HtmlFunctions.HtmlTableCell[][] => {
        const semesters = util.range(semesterCellCount, 1);
        const moduleCreditGradeInfo = ModuleInfo.getModuleCredits(moduleData);
        const semesterStats = semesters.map((semester) => {
            const semesterModules = moduleCreditGradeInfo
                .filter((moduleInfo) => moduleInfo.grade !== undefined)
                .filter((moduleInfo) => moduleInfo.semester !== undefined)
                .filter((moduleInfo) => moduleInfo.semester === semester);
            const creditSumSemester = semesterModules
                .reduce((sum, currentModule) => sum + currentModule.credits, 0);
            const creditSumAllSemester = moduleData
                .filter((moduleInfo) =>
                    (moduleInfo.participated_semesters !== undefined
                 && moduleInfo.participated_semesters.includes(semester))
                || (moduleInfo.wrote_exam_semesters !== undefined
                    && moduleInfo.wrote_exam_semesters.includes(semester)))
                .reduce((sum, currentModule) => sum + currentModule.credits, 0);
            const credGradeProg: ProgressCreditsGradeSemester = semesterModules
                .reduce((result: ProgressCreditsGradeSemester,
                    currentModuleInfo) => ({
                    credits: result.credits + currentModuleInfo.credits,
                    grade: result.grade + ((currentModuleInfo.grade ? currentModuleInfo.grade : 0) / creditSumSemester) *
                    currentModuleInfo.credits
                }), { credits: 0, grade: 0 });

            // A single ECTS credit approximates a 30-hour work load per semester
            const hoursPerEtcsCredit = 30;
            // The time courses are given approximates on average 15 weeks
            const weeksPerSemester = 25;

            return {
                averageGradePerSemester: `${parseFloat(credGradeProg.grade.toFixed(1))}`,
                pointsPerSemester: {
                    registered: creditSumAllSemester,
                    achieved: credGradeProg.credits
                },
                hoursPerSemesterWeek: {
                    registered: (creditSumAllSemester * hoursPerEtcsCredit) / weeksPerSemester,
                    achieved: (credGradeProg.credits * hoursPerEtcsCredit) / weeksPerSemester
                }
            };
        });

        return [
            [
                { content: "Average grade per semester", colSpan: tableCellOffset },
                ...semesterStats.map((a) => ({ content: a.averageGradePerSemester }))
            ],
            [
                { content: "Points per semester (achieved/registered)", colSpan: tableCellOffset },
                ...semesterStats.map((a) => ({ content: `${a.pointsPerSemester.achieved}/${
                    a.pointsPerSemester.registered} (${
                    parseFloat((a.pointsPerSemester.achieved / a.pointsPerSemester.registered * 100).toFixed(1))}%)` }))
            ],
            [
                { content: "Registered hours per week in lecture period (achieved/registered)", colSpan: tableCellOffset },
                ...semesterStats.map((a) => ({ content: `${a.hoursPerSemesterWeek.achieved}/${
                    a.hoursPerSemesterWeek.registered}` }))
            ]
        ];
    };

    const latestSemester = semesterCount % 2
        ? data.start_year.semester
        : (data.start_year.semester === "SS" ? "WS" : "SS");

    const semesterInfo = {
        startSemester: data.start_year.semester,
        latestSemester,
        startYear: data.start_year.year,
        latestYear: data.start_year.year + Math.floor(semesterCount / 2)
    };

    const renderSemester = (semester: "SS" | "WS", year: number): string => {
        if (semester === "SS") {
            return `${semester} ${year}`;
        } else {
            return `${semester} ${year}/${year + 1}`;
        }
    };

    const htmlTable: string = HtmlFunctions.createTable(
        [
            [
                { content: "", headerCell: true, colSpan: tableCellCountWoSem },
                {
                    content: `Semester (${renderSemester(semesterInfo.startSemester, semesterInfo.startYear)} - ${
                        renderSemester(semesterInfo.latestSemester, semesterInfo.latestYear)} )`,
                    headerCell: true,
                    colSpan: semesterCount
                }
            ],
            [
                { content: "Module", headerCell: true },
                { content: "Grade", headerCell: true },
                { content: "ETCS", headerCell: true },
                ...semesterList
                    .map((semester) => ({ content: `${semester}`, headerCell: true }))
            ]
        ],
        [
            ...util.flattenArray(data.module_groups.map((moduleGroup) =>
                createModuleGroupSectionForTable(moduleGroup, true))),
            ...createSemesterProgressRows(tableCellCountWoSem, semesterCount /* , moduleData */)
        ]
    );

    const creditProgress = util.progressCalculator(credits, data.needed_credits, 0);
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
            { content: `${parseFloat(grade.toFixed(1))}` }
        ],
        [
            { content: "Credits per semester" },
            { content: `${parseFloat((credits / semesterCount).toFixed(3))}` }
        ],
        [
            { content: "Exam 2nd tries" },
            { content: `${examTryCount.two}` }
        ],
        [
            { content: "Exam 3rd tries" },
            { content: `${examTryCount.three}` }
        ]
    ]);

    // Create HTML document content
    const cssContent = (await fs.readFile(inputCssFilePath, "utf8")).replace(/(?:\r\n|\r|\n|\s)/g, "");
    const htmlDocumentContent = `<!DOCTYPE html><html><head><style>${cssContent
    }</style><meta charset="UTF-8"></head><body><h2>${data.title}</h2><h3>${
        data.name.surname}, ${data.name.first_name} - ${
        data.matriculation_number} (${data.field_of_study}, ${
        data.current_semester}. semester)</h3><h4>${currentIsoDateString}</h4>${
        htmlTable}<br>${htmlTableStats}</body></html>`;

    // Write table to local file
    await fs.writeFile(outputHtmlFilePath, htmlDocumentContent);
    console.info(`HTML table was written to '${outputHtmlFilePath}' in ${performance.now()} ms using ${dataFilePath}`);

})().catch(err => {
    console.error(err);
    process.exit(1);
});
