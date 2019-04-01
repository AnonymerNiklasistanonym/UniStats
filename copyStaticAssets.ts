import * as shell from "shelljs";

/**
 * Easily copy files to dist
 * @param path Path to copy to dist
 */
function easyCopy(file: string, dir: string = "."): void {
    shell.mkdir("-p", `dist/${dir}`);
    shell.cp(`${dir}/${file}`, `dist/${dir}/${file}`);
}

easyCopy("default_table_style.css", "templates");
easyCopy("demo.json", "data");
