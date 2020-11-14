#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../workers/core/company";
import * as yandex from "../workers/fetcher/integrations/yndx";
import { interval } from "rxjs";
import { filter } from "rxjs/operators";
import { createLogger } from "../workers/core/functions";
import { DocumentsStorageFileSystem } from "../common/documents-storage";
import { Fetcher } from "../common/types";
import { YandexFetcher } from "../workers/fetcher/integrations/yndx";
import { FileSystemLocker, withLock } from "../workers/core/locker";

export type FetcherImplementation = () => Promise<void>;

const tempDir = (subDir: Company) => `/tmp/invest_bot/${subDir}/fetcher`;
const logDir = (subDir: Company | string) => `/var/log/invest_bot/${subDir}/fetcher`;

const mainLogger = createLogger(logDir('main'));
const fetchers = new Map<Company, Fetcher>();

const storage = new DocumentsStorageFileSystem('/tmp/invest_bot/documents');

fetchers.set('Yndx', new YandexFetcher(createLogger(logDir('Yndx'))));


withLock(new FileSystemLocker('fetcher', '/tmp/invest_bot'), async () => {
  for (const [company, fetcher] of fetchers.entries()) {
    try {
      const url = companyUrls[company];

      const documents = await fetcher.fetchAllDocuments(url);

    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    }
  }
});
