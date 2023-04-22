export interface UniTemplate {
  /**
   * Your current semeser/Dein aktuelles Semester
   */
  current_semester: number;
  /**
   * The title of the document/Titel des Dokuments
   */
  title: string;
  /**
   * Your start year/Dein Startjahr
   */
  start_year: {
    /**
     * Your start year/Dein Startjahr
     */
    year: number;
    /**
     * Your start semester/Dein Startsemester
     */
    semester: "WS" | "SS";
  };
  /**
   * Your field of study/Dein Studiengang bzw. -fach
   */
  field_of_study: string;
  /**
   * The matriculation_number/Die Matrikelnummer
   */
  matriculation_number: number;
  /**
   * Your module groups/Deine Modulgruppen
   */
  module_groups: ModuleGroup[];
  /**
   * Your name/Dein Name
   */
  name: {
    /**
     * Your first_name/Dein Vorname
     */
    first_name: string;
    /**
     * Your surname/Dein Nachname
     */
    surname: string;
  };
  /**
   * The needed ETCS credits/Die zu erreichenden ETCS Credits
   */
  needed_credits: number;
}
/**
 * A group of modules/Ein Gruppe von Modulen
 */
export interface ModuleGroup {
  /**
   * Module group name/Modulgruppenname
   */
  name: string;
  /**
   * Module group modules/Modulgruppen Module
   */
  modules?: Module[];
  /**
   * Catalogs/Kataloge
   */
  catalogs?: Catalog[];
}
/**
 * A module/Ein Modul
 */
export interface Module {
  /**
   * ETCS credits/ETCS Credits
   */
  credits: number;
  /**
   * Did you participate in an oral exam because of you had not any exam tries left?/Hast du an einer mündlichen Prüfung teilgenommen weil du keine Klausurversuche mehr hattest?
   */
  oral_exam?: boolean;
  /**
   * Module or exam grade/Modul- oder Klausurnote
   */
  grade?: number;
  /**
   * Module name/Modulname
   */
  name: string;
  /**
   * Module number/Modulnummer
   */
  number: number;
  /**
   * List of all semesters you participated this course/Liste an Semestern in welchen du dieses Modul besucht hast
   */
  participated_semesters?: number[];
  /**
   * The recommended semester/Das empfohlene Semester
   */
  recommended_semester?: number;
  /**
   * The weighting factor of the grade/Der Gewichtungsfaktor für die Note
   */
  weighting_factor?: number;
  /**
   * A list of all semesters you wrote the exam/Eine Liste von allen Semestern in welchen du die Klausur geschrieben hast
   */
  wrote_exam_semesters?: number[];
}
/**
 * A catalog/Ein Katalog
 */
export interface Catalog {
  /**
   * The minimum ETCS credits you need from this catalog/Die kleinste Anzahl an ETCS credits welche man in diesem Katalog besitzen muss
   */
  credits: number;
  /**
   * Catalog name/Katalogname
   */
  name: string;
  /**
   * Catalog number/Katalognummer
   */
  number: number;
  /**
   * Catalog modules/Katalogmodule
   */
  modules?: Module[];
}
