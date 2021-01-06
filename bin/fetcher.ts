#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../modules/core/company";
import { createLogger, defaultDirs, shellExec } from "../modules/core/functions";
import { Fetcher } from "../modules/core/types";
import { YandexFetcher } from "../modules/fetchers/yndx";
import { lockers, withLock } from "../modules/core/locker";
import { config as setupDotenv } from 'dotenv';
import * as minimist from "minimist";
import { createConnection } from "typeorm";
import { ReportEntity } from "../modules/domain/report.entity";

setupDotenv();

const args = minimist(process.argv);
const logDir = args['log-dir']
const reportDir = args['report-dir'];
const help = args['h'] ?? args['help'];

if (help) {
	printHelp();
	process.exit(1);
}

const mainLogger = createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.fetcher('main'));
const fetchers = new Map<Company, Fetcher>();

fetchers.set('Yndx', new YandexFetcher(createLogger(logDir ? `${logDir}/Yndx` : defaultDirs.logs.fetcher('Yndx'))));


withLock(lockers.usingTempDir('fetchers'), async () => {
	const connection = await createConnection('default');
	const reports = await connection.getRepository(ReportEntity);

	for (const [company, fetcher] of fetchers.entries()) {
		try {
			const url = companyUrls[company];

			const documents = await fetcher.fetchAllDocuments(url);

			for (const { title, url } of documents) {
				const found = await reports.findOne({ company, title });

				if (found) {
					mainLogger.debug(`Skipping ${title}`);
					continue;
				}

				const { id } = await reports.save({ title, company });
				mainLogger.info(`Saved ${title} (${url})`);

				const tempFilepath = reportDir ? `${reportDir}/temp.pdf` : `${defaultDirs.fetcherFiles}/temp.pdf`;
				const reportFilepath = reportDir ? `${reportDir}/${id}` : `${defaultDirs.fetcherFiles}/${id}`;

				const download = `curl '${url}' -o ${tempFilepath}`;
				const convert = `pdftotext -layout ${tempFilepath} ${reportFilepath}`;

				// todo: this should be implemented via js
				await shellExec(`${download} && ${convert} && rm ${tempFilepath}`);
			}

		} catch (e) {
			// only unhandled exception may occur here
			mainLogger.error(String(e));
		}
	}
}).catch(console.error);

function printHelp(): void {
	console.log(`
	Executes all 'fetcher' implementations and downloads new missing reports.  

	--help	-h	Shows this message.
	--log-dir	Defines directory for logs.
	--report-dir	Defines directory for fetched reports.
	`);
}
