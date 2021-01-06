import { Logger } from "winston";
import { ParserImplementation } from "../../bin/parser";

type Options = {
  logger: Logger
};

export function createImplementation({ logger }: Options): ParserImplementation {
  return async (content: string) => {

    // parsing logic

    return content;
  };
}
