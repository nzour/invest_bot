import { Logger } from "winston";
import { ParserImplementation } from "../../bin/parser";
import { TextMatcher } from "../core/text-matcher";

type Options = {
  logger: Logger
};

export function createImplementation({ logger }: Options): ParserImplementation {
  return async (content: string) => {
    return TextMatcher.from(content)
      .search('Financial Highlights')
      .takeUntil(TextMatcher.EMPTY_LINE, 2)
      .onlyLinesWith('$')
      .removeNonASCIISymbols()
      .trimEachLine()
      .toString();
  };
}
