import { UniTemplate, Module, Catalog } from "../templates/uni_template"

export interface CreditsAndGrade {
    credits: number;
    grade: number;
}

function getCreditsFromModule(module: Module[]) {
    return module.reduce((creditsGradeList: CreditsAndGrade[], currentModule: Module) => {
        if (currentModule.grade !== undefined) {
            creditsGradeList.push({
                credits: currentModule.credits,
                grade: currentModule.grade
            })
        }
        return creditsGradeList
    }, [])
}
export function getCredits(modules: UniTemplate["modules"]) {
    return getCreditsFromModule([
        ...modules.base, ...modules.core,
        ...modules.key_qualifications,
        ...modules.supplementary.map(catalog => catalog.modules).reduce((concatenatedModules, currentModule) => concatenatedModules.concat(currentModule), [])
    ])
}

function getExamTryCountFromModule(module: Module[]) {
    return module.reduce((examTryCount, currentModule: Module) => {
        if (currentModule.wrote_exam_semesters !== undefined) {
            if (currentModule.wrote_exam_semesters.length >= 2) {
                examTryCount.secondTry++
            }
            if (currentModule.wrote_exam_semesters.length >= 3) {
                examTryCount.thirdTry++
            }
        }
        return examTryCount
    }, {
        secondTry: 0,
        thirdTry: 0,
    })
}
export function getExamTryCount(modules: UniTemplate["modules"]) {
    return getExamTryCountFromModule([
        ...modules.base, ...modules.core,
        ...modules.key_qualifications,
        ...modules.supplementary.map(catalog => catalog.modules).reduce((concatenatedModules, currentModule) => concatenatedModules.concat(currentModule), [])
    ])
}
