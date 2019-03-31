import { Catalog, Module, UniTemplate } from "../templates/uni_template";

/**
 * Catalog information
 */
export interface ICatalogInfo {
    /**
     * Catalog name
     */
    name: string;
    /**
     * Catalog number
     */
    number: number;
}

/**
 * Module information
 */
export interface IModuleInfo {
    /**
     * Catalog information
     */
    catalog?: ICatalogInfo;
    /**
     * Section name
     */
    section: "base" | "core" | "supplementary" | "key_qualifications";
}

/**
 * Module with extra information
 */
export interface IModuleWithInfo extends Module {
    /**
     * Additional module info
     */
    info: IModuleInfo;
}

/**
 * Map module to a modules with module information
 * @param module The module that should be mapped
 * @param section The section the module originates from
 * @param catalog The catalog of the module (optional)
 */
function mapModuleToModuleWithInfo(module: Module,
                                   section: IModuleInfo["section"],
                                   catalog?: IModuleInfo["catalog"]):
    IModuleWithInfo {
    return { ...module, info: { section, catalog } };
}

/**
 * Map catalog to a list of modules with module/catalog information
 * @param catalog The catalog that should be mapped
 */
function mapCatalogToModulesWithInfo(catalog: Catalog): IModuleWithInfo[] {
    if (catalog.modules === undefined) {
        throw Error("The catalog does not contain any modules!");
    }

    return catalog.modules.map((module) => mapModuleToModuleWithInfo(
        module, "supplementary",
        { name: catalog.name, number: catalog.number }));
}

/**
 * Map all modules to a list of modules with module/catalog information
 * @param modules The modules of the source JSON file that should be mapped
 */
export function getModules(modules: UniTemplate["modules"]): IModuleWithInfo[] {
    if (modules === undefined) {
        throw Error("The JSON modules section was undefined!");
    }

    return [
        ...modules.base
            .map((module) => mapModuleToModuleWithInfo(module, "base")),
        ...modules.core
            .map((module) => mapModuleToModuleWithInfo(module, "core")),
        ...modules.key_qualifications
            .map((module) => mapModuleToModuleWithInfo(
                module, "key_qualifications")),
        // Change to array.flat(1) if this is integrated into Nodejs
        ...Array<IModuleWithInfo>().concat.apply([], modules.supplementary
            .map(mapCatalogToModulesWithInfo)),
    ];
}

/**
 * Module with special information surrounding credits
 */
export interface IModuleCredit {
    /**
     * ETCS Credits
     */
    credits: number;
    /**
     * Exam grade
     */
    grade?: number;
    /**
     * Module information
     */
    info: IModuleInfo;
    /**
     * The semester the exam was written
     */
    semester?: number;
}

/**
 * Map a list of modules to a list of credit/grade specified entries
 * @param modules List of modules that should be mapped
 */
export function getModuleCredits(modules: IModuleWithInfo[]): IModuleCredit[] {
    return modules.map((currentModule) => {
        const moduleCredit: IModuleCredit = {
            credits: currentModule.credits,
            info: currentModule.info,
        };
        if (currentModule.grade !== undefined) {
            moduleCredit.grade = currentModule.grade;
            if (currentModule.wrote_exam_semesters === undefined ||
                currentModule.wrote_exam_semesters.length <= 0) {
                throw Error(`Exam was never written but a grade was found! ${
                    JSON.stringify(currentModule)}`);
            }
            moduleCredit.semester = Math
                .max(...currentModule.wrote_exam_semesters);
        }

        return moduleCredit;
    });
}

/**
 * Module with special information surrounding exam tries
 */
export interface IModuleExamTries {
    /**
     * Module information
     */
    info: IModuleInfo;
    /**
     * The semesters the tries were tried
     */
    semesters?: number[];
    /**
     * Number of tries to write the exam
     */
    tries: number;
}

/**
 * Map a list of modules to a list of exam tries specified entries
 * @param modules List of modules that should be mapped
 */
export function getModuleExamTries(modules: IModuleWithInfo[]):
    IModuleExamTries[] {
    return modules.map((currentModule) => {
        const moduleExamTries: IModuleExamTries = {
            info: currentModule.info,
            tries: 0,
        };
        if (currentModule.wrote_exam_semesters !== undefined) {
            moduleExamTries.tries = currentModule.wrote_exam_semesters.length;
            moduleExamTries.semesters = currentModule.wrote_exam_semesters
                .sort((a, b) => a - b);
        }

        return moduleExamTries;
    });
}
