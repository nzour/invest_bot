#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../workers/core/company";
import * as yandex from "../workers/fetcher/integrations/yndx";
import { interval } from "rxjs";
import { filter } from "rxjs/operators";
import { createLogger, useWithLockFunction } from "../workers/core/functions";
import { DocumentsStorageFileSystem } from "../common/documents-storage";
import { Fetcher } from "../common/types";
import { YandexFetcher } from "../workers/fetcher/integrations/yndx";

export type FetcherImplementation = () => Promise<void>;

const tempDir = (subDir: Company) => `/tmp/invest_bot/${subDir}/fetcher`;
const logDir = (subDir: Company | string) => `/var/log/invest_bot/${subDir}/fetcher`;

const mainLogger = createLogger(logDir('main'));
const fetchers = new Map<Company, Fetcher>();

const storage = new DocumentsStorageFileSystem('/tmp/invest_bot/documents');

fetchers.set('Yndx', new YandexFetcher(createLogger(logDir('Yndx'))));

async function runAllIntegrations(): Promise<void> {
  for (const [company, fetcher] of fetchers.entries()) {
    try {
      const url = companyUrls[company];

      const documents = await fetcher.fetchAllDocuments(url);

    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    }
  }
}

const { isLocked, withLock } = useWithLockFunction();

interval(10000) // every 10 seconds
  .pipe(
    filter(() => !isLocked()),
  )
  .subscribe(async () => await withLock(runAllIntegrations));

