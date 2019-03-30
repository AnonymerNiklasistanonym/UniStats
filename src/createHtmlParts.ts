import { UniTemplate, Module } from "../templates/uni_template"

export namespace HtmlFunction {

    export interface HtmlTableCell {
        content: string | number;
        rowSpan?: number;
        colSpan?: number;
        classes?: string[];
        headerCell?: boolean;
    }

    export function createModuleEntry(module: Module) {
        return "<div>" + `<p class="title">${module.name}</p>` +
            `<p class="number">${module.number}</p>` + "</div>"
    }

    export function createCellEntry(cell: HtmlTableCell) {
        const rowSpan = cell.rowSpan !== undefined
            ? ` rowspan="${cell.rowSpan}"` : ""
        const colSpan = cell.colSpan !== undefined
            ? ` colspan="${cell.colSpan}"` : ""
        const classes = (cell.classes !== undefined && cell.classes.length > 0)
            ? ` class="${cell.classes.join(" ")}"` : ""
        const tagName = cell.headerCell !== undefined && cell.headerCell ? "th" : "td"
        return `<${tagName}${rowSpan}${colSpan}${classes}>${cell.content}</${tagName}>`
    }

    export function createTable(header: HtmlTableCell[][], body: HtmlTableCell[][]) {
        const table_header = "<thead>" +
            header.map(row => "<tr>" + row.map(cell => createCellEntry(cell)).join("") + "</tr>").join("") +
            "</thead>"
        const table_body = "<tbody>" +
            body.map(row => "<tr>" + row.map(cell => createCellEntry(cell)).join("") + "</tr>").join("") +
            "</tbody>"
        return "<table>" + table_header + table_body + "</table>"
    }

}
