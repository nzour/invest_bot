#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../core/company";
import * as yandex from "./integrations/yndx";
import { interval } from "rxjs";
import { filter } from "rxjs/operators";
import { FetcherIntegrationImplementation } from "../../common/types";
import { createLogger } from "../core/functions";
import { DocumentsStorageFileSystem } from "../../common/documents-storage";

const tempDir = (subDir: Company) =>  `/tmp/invest_bot/${subDir}`;
const logDir = (subDir: Company | string) =>  `/var/log/invest_bot/${subDir}`;

const mainLogger = createLogger(logDir('main'));
const integrationsMap = new Map<Company, FetcherIntegrationImplementation>();

const storage = new DocumentsStorageFileSystem('/tmp/invest_bot/documents');

integrationsMap.set('Yndx', yandex.createIntegration({
  mainUrl: companyUrls.Yndx,
  directoryToSave: tempDir('Yndx'),
  logger: createLogger(logDir('Yndx')),
  storage
}));

let isLocked = false;

async function withLock(callable: () => Promise<void>): Promise<void> {
  isLocked = true;

  try {
    await callable();
  } finally {
    isLocked = false;
  }
}

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
    filter(() => !isLocked),
  )
  .subscribe(async () => await withLock(runAllIntegrations));

