import { Module } from "./templates/uni_template";

/**
 * HTML table cell structure
 */
export interface HtmlTableCell {
    /**
     * Classes of the `td` tag
     * @example <td class="a b c"></td>
     */
    classes?: string[]
    /**
     * `colspan` of the `td` tag
     * @example <td colspan="#"></td>
     */
    colSpan?: number
    /**
     * The content of the table cell
     */
    content: string
    /**
     * Is it a header cell (then use `th` tag, else use `td` tag)
     */
    headerCell?: boolean
    /**
     * `rowspan` of the `td` tag
     * @example <td rowspan="#"></td>
     */
    rowSpan?: number
}

/**
 * HTML module cell entry parser
 * @param cell The cell structure on which basis the HTML should be parsed
 */
// eslint-disable-next-line complexity
export const createCellEntry = (cell: HtmlTableCell): string => {
    const rowSpan: string = cell.rowSpan !== undefined
        ? ` rowspan="${cell.rowSpan}"` : "";
    const colSpan: string = cell.colSpan !== undefined
        ? ` colspan="${cell.colSpan}"` : "";
    const classes: string =
        (cell.classes !== undefined && cell.classes.length > 0)
            ? ` class="${cell.classes.join(" ")}"` : "";
    const tagName: string =
        (cell.headerCell !== undefined && cell.headerCell)
            ? "th" : "td";

    return `<${tagName}${rowSpan}${colSpan}${classes}>${cell.content}</${tagName}>`;
};

/**
 * HTML table (cells) parser
 * @param header The header `thead` cells structure
 * @param body The body `tbody` cells structure
 */
export const createTable = (header: HtmlTableCell[][], body: HtmlTableCell[][]): string => {
    const tableHeader: string = header
        .map((row) => `<tr>${row.map(createCellEntry).join("")}</tr>`)
        .join("");
    const tableBody: string = body
        .map((row) => `<tr>${row.map(createCellEntry).join("")}</tr>`)
        .join("");

    return `<table><thead>${tableHeader}</thead><tbody>${tableBody}</tbody></table>`;
};

/**
 * HTML module entry structure creator
 * @param module The module of which such a structure should be created
 */
export const createModuleEntry = (module: Module): string =>
    "<div>" + `<p class="title">${module.name}</p><p class="number">${module.number}</p>` + "</div>";
