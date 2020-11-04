#!/usr/bin/env ts-node-script

import { Company } from "../workers/core/company";
import { createLogger, useWithLockFunction } from "../workers/core/functions";
import * as yandex from '../workers/parser/implementations/yndx';
import { interval } from "rxjs";
import { filter } from "rxjs/operators";

export type ParserImplementation = () => Promise<string>;

const tempDir = (subDir: Company) =>  `/tmp/invest_bot/${subDir}/parser`;
const logDir = (subDir: Company | string) =>  `/var/log/invest_bot/${subDir}/parser`;

const mainLogger = createLogger(logDir('main'));
const implementationsMap = new Map<Company, ParserImplementation>();

implementationsMap.set('Yndx', yandex.createImplementation({
  logger: createLogger(logDir('Yndx')),
  documentsDirectory: '/tmp'
}));

const { isLocked, withLock } = useWithLockFunction();

async function runAllImplementations(): Promise<void> {
  mainLogger.info('Running all implementations');

  let startedAt: number | undefined;

  for (const [name, implantation] of implementationsMap.entries()) {
    try {
      mainLogger.info(`Started implementation ${name}`);
      startedAt = Date.now();

      await implantation();
    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    } finally {
      mainLogger.info(`Done implementation ${name}, (${(Date.now() - startedAt) / 1000})`);
    }
  }
}

interval(10000)
  .pipe(
    filter(() => !isLocked())
  )
  .subscribe(async () => await withLock(runAllImplementations));


