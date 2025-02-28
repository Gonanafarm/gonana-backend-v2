import * as path from "path";
import * as fs from "fs";
import {once} from "lodash";

export const createLogsDirectory = once(() => {
  const logDirectory = process.env.LOG_DIR || path.resolve("./logs");

  try {
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
  } catch (e) {
    console.error(`Cannot create log directory: ${e}`); // tslint:disable-line no-console
  }

  return logDirectory;
});

export function containsOrderSettlementIncludes(text: string): boolean {
  return text.includes("Order Settlement from Gonana/GON");
}

export function convertDateFormat(dateStr: string): string {
  const monthMap: Record<string, string> = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };

  // Check if the string is already in the 'dd/mm/yyyy' format using a regex
  const isAlreadyFormatted = /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
  if (isAlreadyFormatted) {
    return dateStr; // Return the input string as-is
  }

  // Split the input date string
  const [day, month, year] = dateStr.split("-");

  // Validate the input format
  if (!day || !month || !year) {
    throw new Error("Invalid date format. Expected 'DD-MMM-YYYY'.");
  }

  // Map the month abbreviation to its corresponding numeric value
  const numericMonth = monthMap[month.toUpperCase()];
  if (!numericMonth) {
    throw new Error("Invalid month abbreviation in date string.");
  }

  // Format and return the date as dd/mm/yyyy
  return `${day.padStart(2, "0")}/${numericMonth}/${year}`;
}

export function removeUndefinedProperties<T extends object>(obj: T): void {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
}

export function compareKeys(
  objA: {[key: string]: any}, // Object `a` with any properties
  objB: {[key: string]: any}, // Object `b` with any properties
  keyA: string, // Key to select from object `a`
  keyB: string, // Key to select from object `b`
): boolean {
  console.log("objA name:", objA[keyA].toLowerCase());
  console.log("objB name:", objB[keyB].toLowerCase());

  return objA[keyA].toLowerCase() === objB[keyB].toLowerCase();
}
export const reverseDateFormat = (date: string) =>
  date.split("/").reverse().join("/");
