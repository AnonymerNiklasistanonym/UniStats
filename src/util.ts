/**
 * Python like range function
 * @param size The size of the list/array to be created
 * @param startAt The index from which the list should start
 */
export function range(size: number, startAt: number = 0): number[] {
    return [...Array(size).keys()].map((i: number) => i + startAt);
}

/**
 * Progress calculator result
 */
export interface IProgressCalculator {
    /**
     * Achieved number
     */
    achieved: number;
    /**
     * Missing number from achieved to whole
     */
    missing: number;
    /**
     * Percentage of achieved number to whole number
     */
    percentage: number;
    /**
     * Whole number
     */
    whole: number;
}

/**
 * Calculate a progress between a whole number and an achieved part of it
 * @param achieved The achieved part of the whole
 * @param whole The whole
 * @param decimalPoints To how many decimal points should the result ber rounded
 */
export function progressCalculator(achieved: number, whole: number,
                                   decimalPoints: number = 0):
                                   IProgressCalculator {
    const DECIMAL_BASE: number = 10;
    const PERCENTAGE_TO_INT: number = 2;
    const ROUNDING_CORRECTION: number = DECIMAL_BASE **
     (decimalPoints + PERCENTAGE_TO_INT);

    return {
        achieved,
        missing: whole - achieved,
        percentage: Math.round((achieved / whole) * ROUNDING_CORRECTION),
        whole,
    };
}

/**
 * Flatten an array
 * @param array Array that should be flattened
 * @example flattenArray([[1,2,3],[4,5,6]]) === [1,2,3,4,5,6]
 */
export function flattenArray<T>(array: T[][]): T[] {
    return Array<T>().concat.apply([], array);
}
