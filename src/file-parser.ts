import parse from "csv-parse/lib/sync";

import { Row } from "./schemas";

interface ParserConfig {
  delimiter: string;
}

export const fileParser = (
  fileInput: string,
  config: ParserConfig
): Array<Row> => {
  return parse(fileInput, {
    ...config,
  });
};

export const dateFromFilename = (fileName: string): Date => {
  const sub = fileName.substr(fileName.length - 16, 10); // date 2021021402 - yyyymmddhh
  const year = sub.substring(0, 4);
  const month = sub.substring(4, 6);
  const day = sub.substring(6, 8);
  const hour = sub.substring(8, 10);
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour));
};
