#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../workers/core/company";
import * as yandex from "../workers/fetcher/integrations/yndx";
import { interval } from "rxjs";
import { filter } from "rxjs/operators";
import { createLogger, useWithLockFunction } from "../workers/core/functions";
import { DocumentsStorageFileSystem } from "../common/documents-storage";

export type FetcherImplementation = () => Promise<void>;

const tempDir = (subDir: Company) => `/tmp/invest_bot/${subDir}/fetcher`;
const logDir = (subDir: Company | string) => `/var/log/invest_bot/${subDir}/fetcher`;

const mainLogger = createLogger(logDir('main'));
const integrationsMap = new Map<Company, FetcherImplementation>();

const storage = new DocumentsStorageFileSystem('/tmp/invest_bot/documents');

integrationsMap.set('Yndx', yandex.createIntegration({
  mainUrl: companyUrls.Yndx,
  directoryToSave: tempDir('Yndx'),
  logger: createLogger(logDir('Yndx')),
  storage
}));

const { isLocked, withLock } = useWithLockFunction();

async function runAllIntegrations(): Promise<void> {
  mainLogger.info('Running all integrations');

  let startedAt: number | undefined;

  for (const [name, integration] of integrationsMap.entries()) {
    try {
      mainLogger.info(`Started integration ${name}`);
      startedAt = Date.now();

      await integration();
    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    } finally {
      mainLogger.info(`Done integration ${name}, (${(Date.now() - startedAt) / 1000})`);
    }
  }
}

interval(10000) // every 10 seconds
  .pipe(
    filter(() => !isLocked()),
  )
  .subscribe(async () => await withLock(runAllIntegrations));

