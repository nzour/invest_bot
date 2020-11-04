import { Logger } from "winston";
import { ParserImplementation } from "../../../bin/parser";
import { PathLike } from "fs";
import * as fs from "fs/promises";

type Options = {
  logger: Logger,
  documentsDirectory: PathLike
};

export function createImplementation({ logger, documentsDirectory }: Options): ParserImplementation {
  return async () => {
    const files = await fs.readdir(documentsDirectory);

    const textFiles = files.filter(f => f.endsWith('.txt'));



    return '';
  };
}
