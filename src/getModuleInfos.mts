// Relative imports
import { flattenArray } from "./util.mjs";
// Type imports
import type { Catalog, Module, ModuleGroup } from "./uniTemplate.mjs";

/**
 * Catalog information
 */
interface CatalogInfo {
  /**
   * Catalog name
   */
  name: string;
  /**
   * Catalog number
   */
  catalogNumber: number;
}

/**
 * Module information
 */
interface ModuleInfo {
  /**
   * Catalog information
   */
  catalog?: CatalogInfo;
  /**
   * Section name
   */
  section: string;
}

/**
 * Module with extra information
 */
interface ModuleWithInfo extends Module {
  /**
   * Additional module info
   */
  info: ModuleInfo;
}

/**
 * Map module to a modules with module information
 * @param module The module that should be mapped
 * @param section The section the module originates from
 * @param catalog The catalog of the module (optional)
 */
const mapModuleToModuleWithInfo = (
  module: Readonly<Module>,
  section: Readonly<ModuleInfo["section"]>,
  catalog?: Readonly<ModuleInfo["catalog"]>
): ModuleWithInfo => {
  return { ...module, info: { section, catalog } };
};

/**
 * Map catalog to a list of modules with module/catalog information
 * @param catalog The catalog that should be mapped
 * @param section
 */
const mapCatalogToModulesWithInfo = (
  catalog: Readonly<Catalog>,
  section: string
): ModuleWithInfo[] => {
  if (catalog.modules === undefined) {
    throw Error("The catalog does not contain any modules!");
  }

  return catalog.modules.map((module) =>
    mapModuleToModuleWithInfo(module, section, {
      name: catalog.name,
      catalogNumber: catalog.number,
    })
  );
};

/**
 * Map all modules to a list of modules with module/catalog information
 * @param modules The modules of the source JSON file that should be mapped
 * @param moduleGroups
 */
export const getModules = (
  moduleGroups: ReadonlyArray<ModuleGroup>
): ModuleWithInfo[] => {
  return flattenArray([
    ...moduleGroups.reduce((result: ModuleWithInfo[][], moduleGroup) => {
      if (moduleGroup.modules) {
        result.push(
          moduleGroup.modules.map((module) =>
            mapModuleToModuleWithInfo(module, moduleGroup.name)
          )
        );
      }
      return result;
    }, []),
    ...moduleGroups.reduce((result: ModuleWithInfo[][], moduleGroup) => {
      if (moduleGroup.catalogs) {
        result.push(
          flattenArray(
            moduleGroup.catalogs.map((catalog) =>
              mapCatalogToModulesWithInfo(catalog, moduleGroup.name)
            )
          )
        );
      }
      return result;
    }, []),
  ]);
};

/**
 * Module with special information surrounding credits
 */
interface ModuleCredit {
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
  info: ModuleInfo;
  /**
   * The semester the exam was written
   */
  semester?: number;
}

/**
 * Map a list of modules to a list of credit/grade specified entries
 * @param modules List of modules that should be mapped
 */
export const getModuleCredits = (
  modules: ReadonlyArray<ModuleWithInfo>
): ModuleCredit[] =>
  modules.map((currentModule) => {
    const moduleCredit: ModuleCredit = {
      credits: currentModule.credits,
      info: currentModule.info,
    };
    if (currentModule.grade !== undefined) {
      moduleCredit.grade = currentModule.grade;
      if (
        currentModule.wrote_exam_semesters === undefined ||
        currentModule.wrote_exam_semesters.length <= 0
      ) {
        throw Error(
          `Exam was never written but a grade was found! ${JSON.stringify(
            currentModule
          )}`
        );
      }
      moduleCredit.semester = Math.max(...currentModule.wrote_exam_semesters);
    }

    return moduleCredit;
  });

/**
 * Module with special information surrounding exam tries
 */
interface ModuleExamTries {
  /**
   * Module information
   */
  info: ModuleInfo;
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
export const getModuleExamTries = (
  modules: ReadonlyArray<ModuleWithInfo>
): ModuleExamTries[] =>
  modules.map((currentModule) => {
    const moduleExamTries: ModuleExamTries = {
      info: currentModule.info,
      tries: 0,
    };
    if (currentModule.wrote_exam_semesters !== undefined) {
      moduleExamTries.tries = currentModule.wrote_exam_semesters.length;
      moduleExamTries.semesters = currentModule.wrote_exam_semesters.sort(
        (a, b) => a - b
      );
    }

    return moduleExamTries;
  });

/**
 * Determine classes of a semester of a module
 * @param module Module which should be checked
 * @param semester Semester which should be checked
 */
export const getClassesOfSemesterOfModule = (
  module: Readonly<Module>,
  semester: number
): string[] => {
  const classes: string[] = [];
  if (
    module.recommended_semester !== undefined &&
    module.recommended_semester === semester
  ) {
    classes.push("recommended");
  }
  if (
    module.participated_semesters !== undefined &&
    module.participated_semesters.includes(semester)
  ) {
    classes.push("participated");
  }
  if (
    module.wrote_exam_semesters !== undefined &&
    module.wrote_exam_semesters.includes(semester)
  ) {
    if (module.wrote_exam_semesters.filter((a) => a > semester).length > 0) {
      classes.push("failed_exam");
    } else if (module.grade === undefined) {
      classes.push("pending_exam");
    } else {
      classes.push("wrote_exam");
    }
  }

  return classes;
};

/**
 * Get the sum of achieved credits of a list of modules
 * @param modules The module list which should be analyzed
 */
export const getModuleAchievedCreditSum = (
  modules: ReadonlyArray<Module>
): number =>
  modules
    .filter((a) => a.grade !== undefined)
    .reduce((sum, currentModule) => sum + currentModule.credits, 0);

/**
 * Get the sum of all credits of a list of modules
 * @param modules The module list which should be analyzed
 */
export const getModuleCreditSum = (modules: ReadonlyArray<Module>): number =>
  modules.reduce((sum, currentModule) => sum + currentModule.credits, 0);

/**
 * Get the average of achieved grades of a list of modules
 * @param modules The module list which should be analyzed
 */
export const getModuleGradeAverage = (
  modules: ReadonlyArray<Module>
): number => {
  const moduleCreditSum: number = getModuleAchievedCreditSum(modules);

  return modules
    .filter((a) => a.grade !== undefined)
    .reduce(
      (sum, currentModule) =>
        sum +
        ((currentModule.grade ? currentModule.grade : 0) / moduleCreditSum) *
          currentModule.credits,
      0
    );
};
