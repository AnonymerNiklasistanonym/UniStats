import {
    Catalog,
    Module,
    ModuleGroup
} from "./templates/uni_template";

import {
    flattenArray
} from "./util";

/**
 * Catalog information
 */
export interface CatalogInfo {
    /**
     * Catalog name
     */
    name: string
    /**
     * Catalog number
     */
    catalogNumber: number
}

/**
 * Module information
 */
export interface ModuleInfo {
    /**
     * Catalog information
     */
    catalog?: CatalogInfo
    /**
     * Section name
     */
    section: string
}

/**
 * Module with extra information
 */
export interface ModuleWithInfo extends Module {
    /**
     * Additional module info
     */
    info: ModuleInfo
}

/**
 * Map module to a modules with module information
 * @param module The module that should be mapped
 * @param section The section the module originates from
 * @param catalog The catalog of the module (optional)
 */
const mapModuleToModuleWithInfo = (module: Module,
    section: ModuleInfo["section"],
    catalog?: ModuleInfo["catalog"]): ModuleWithInfo => {
    return { ...module, info: { section, catalog } };
};

/**
 * Map catalog to a list of modules with module/catalog information
 * @param catalog The catalog that should be mapped
 */
const mapCatalogToModulesWithInfo = (catalog: Catalog,
    section: string): ModuleWithInfo[] => {
    if (catalog.modules === undefined) {
        throw Error("The catalog does not contain any modules!");
    }

    return catalog.modules.map((module) => mapModuleToModuleWithInfo(module, section,
        { name: catalog.name, catalogNumber: catalog.number }));
};

/**
 * Map all modules to a list of modules with module/catalog information
 * @param modules The modules of the source JSON file that should be mapped
 */
export const getModules = (moduleGroups: ModuleGroup[]): ModuleWithInfo[] => {
    return flattenArray([
        ...moduleGroups.reduce((result: ModuleWithInfo[][], moduleGroup) => {
            if (moduleGroup.modules) {
                result.push(moduleGroup.modules.map(module => mapModuleToModuleWithInfo(module, moduleGroup.name)));
            }
            return result;
        }, []),
        ...moduleGroups.reduce((result: ModuleWithInfo[][], moduleGroup) => {
            if (moduleGroup.catalogs) {
                result.push(flattenArray(moduleGroup.catalogs
                    .map(catalog => mapCatalogToModulesWithInfo(catalog, moduleGroup.name))));
            }
            return result;
        }, [])
    ]);
};

/**
 * Module with special information surrounding credits
 */
export interface ModuleCredit {
    /**
     * ETCS Credits
     */
    credits: number
    /**
     * Exam grade
     */
    grade?: number
    /**
     * Module information
     */
    info: ModuleInfo
    /**
     * The semester the exam was written
     */
    semester?: number
}

/**
 * Map a list of modules to a list of credit/grade specified entries
 * @param modules List of modules that should be mapped
 */
export const getModuleCredits = (modules: ModuleWithInfo[]): ModuleCredit[] =>
    modules.map((currentModule) => {
        const moduleCredit: ModuleCredit = {
            credits: currentModule.credits,
            info: currentModule.info
        };
        if (currentModule.grade !== undefined) {
            moduleCredit.grade = currentModule.grade;
            if (currentModule.wrote_exam_semesters === undefined ||
                currentModule.wrote_exam_semesters.length <= 0) {
                throw Error(`Exam was never written but a grade was found! ${JSON.stringify(currentModule)}`);
            }
            moduleCredit.semester = Math.max(...currentModule.wrote_exam_semesters);
        }

        return moduleCredit;
    });

/**
 * Module with special information surrounding exam tries
 */
export interface ModuleExamTries {
    /**
     * Module information
     */
    info: ModuleInfo
    /**
     * The semesters the tries were tried
     */
    semesters?: number[]
    /**
     * Number of tries to write the exam
     */
    tries: number
}

/**
 * Map a list of modules to a list of exam tries specified entries
 * @param modules List of modules that should be mapped
 */
export const getModuleExamTries = (modules: ModuleWithInfo[]): ModuleExamTries[] =>
    modules.map((currentModule) => {
        const moduleExamTries: ModuleExamTries = {
            info: currentModule.info,
            tries: 0
        };
        if (currentModule.wrote_exam_semesters !== undefined) {
            moduleExamTries.tries = currentModule.wrote_exam_semesters.length;
            moduleExamTries.semesters = currentModule.wrote_exam_semesters
                .sort((a, b) => a - b);
        }

        return moduleExamTries;
    });
