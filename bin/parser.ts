#!/usr/bin/env ts-node-script

import { Company } from "../modules/core/company";
import { createLogger, defaultDirs } from "../modules/core/functions";
import * as yandex from '../modules/parsers/yndx';
import { lockers, withLock } from "../modules/core/locker";
import { config as setupDotenv } from 'dotenv';

setupDotenv();

export type ParserImplementation = () => Promise<string>;

const mainLogger = createLogger(defaultDirs.logs.parser('main'));
const implementationsMap = new Map<Company, ParserImplementation>();

implementationsMap.set('Yndx', yandex.createImplementation({
  logger: createLogger(defaultDirs.logs.parser('Yndx')),
  documentsDirectory: '/tmp'
}));

withLock(lockers.usingTempDir('parser'), async () => {
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


