#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../modules/core/company";
import { createLogger, defaultDirs } from "../modules/core/functions";
import { Fetcher } from "../modules/core/types";
import { YandexFetcher } from "../modules/fetchers/yndx";
import { lockers, withLock } from "../modules/core/locker";
import { config as setupDotenv } from 'dotenv';
import * as minimist from "minimist";

setupDotenv();

const args = minimist(process.argv);
const logDir = args['log-dir']
const documentsDir = args['documents-dir'];

const mainLogger = createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.fetcher('main'));
const fetchers = new Map<Company, Fetcher>();

fetchers.set('Yndx', new YandexFetcher(createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.fetcher('Yndx'))));


withLock(lockers.usingTempDir('fetchers'), async () => {
  for (const [company, fetcher] of fetchers.entries()) {
    try {
      const url = companyUrls[company];

      const documents = await fetcher.fetchAllDocuments(url);

      console.log(documents);

    } catch (e) {
      // only unhandled exception may occur here
      mainLogger.error(String(e));
    }
  }
}).catch(console.error);
