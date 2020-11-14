#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../workers/core/company";
import { createLogger } from "../workers/core/functions";
import { Fetcher } from "../common/types";
import { YandexFetcher } from "../workers/fetcher/integrations/yndx";
import { FileSystemLocker, withLock } from "../workers/core/locker";

const logDir = (subDir: Company | string) => `/var/log/invest_bot/${subDir}/fetcher`;

const mainLogger = createLogger(logDir('main'));
const fetchers = new Map<Company, Fetcher>();

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
}).catch(console.error);
