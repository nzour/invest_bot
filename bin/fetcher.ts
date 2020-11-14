#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../modules/core/company";
import { createLogger } from "../modules/core/functions";
import { Fetcher } from "../modules/core/types";
import { YandexFetcher } from "../modules/fetchers/yndx";
import { FileSystemLocker, withLock } from "../modules/core/locker";

const logDir = (subDir: Company | string) => `/var/log/invest_bot/${subDir}/fetcher`;

const mainLogger = createLogger(logDir('main'));
const fetchers = new Map<Company, Fetcher>();

fetchers.set('Yndx', new YandexFetcher(createLogger(logDir('Yndx'))));


withLock(new FileSystemLocker('fetchers', '/tmp/invest_bot'), async () => {
  for (const [company, fetcher] of fetchers.entries()) {
    try {
      const url = companyUrls[company];

      const documents = await fetcher.fetchAllDocuments(url);

    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    }
  }
}).catch(console.error);
