#!/usr/bin/env ts-node-script

import { Company } from "../modules/core/company";
import { createLogger } from "../modules/core/functions";
import * as yandex from '../modules/parsers/yndx';
import { FileSystemLocker, withLock } from "../modules/core/locker";

export type ParserImplementation = () => Promise<string>;

const logDir = (subDir: Company | string) =>  `/var/log/invest_bot/${subDir}/parser`;

const mainLogger = createLogger(logDir('main'));
const implementationsMap = new Map<Company, ParserImplementation>();

implementationsMap.set('Yndx', yandex.createImplementation({
  logger: createLogger(logDir('Yndx')),
  documentsDirectory: '/tmp'
}));

withLock(new FileSystemLocker('parser', '/tmp/invest_bot'), async () => {
  for (const [name, implantation] of implementationsMap.entries()) {
    try {
      mainLogger.info(`Started implementation ${name}`);

      await implantation();
    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    }
  }
}).catch(console.error);


