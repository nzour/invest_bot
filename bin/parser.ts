#!/usr/bin/env ts-node-script

import { Company } from "../modules/core/company";
import { createLogger, defaultDirs } from "../modules/core/functions";
import * as yandex from '../modules/parsers/yndx';
import { lockers, withLock } from "../modules/core/locker";
import { config as setupDotenv } from 'dotenv';
import * as minimist from "minimist";
import { createConnection } from "typeorm";
import { ReportEntity } from "../modules/domain/report.entity";
import * as fs from "fs/promises";
import { PathLike } from "fs";

setupDotenv();

const args = minimist(process.argv);
const logDir = args['log-dir'];
const documentDir = args['documents-dir'];

export type ParserImplementation = (reportContent: string) => Promise<string>;

const mainLogger = createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.parser('main'));
const implementationsMap = new Map<Company, ParserImplementation>();

implementationsMap.set('Yndx', yandex.createImplementation({
	logger: createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.parser('Yndx'))
}));

withLock(lockers.usingTempDir('parser'), async () => {
	const connection = await createConnection('default');
	const reportRepository = await connection.getRepository(ReportEntity);

	const toProcess = await reportRepository.find({ result: null })

	if (!toProcess.length) {
		mainLogger.info('There is nothing to process, terminating...');
	} else {
		mainLogger.info(`Processing ${toProcess.length} reports...`);
	}

	for (const report of toProcess) {
		try {
			const implementation = implementationsMap.get(report.company);

			if (!implementation) {
				throw new Error(`Could not find implementation for '${report.company}'`);
			}

			const filepath = compileFilepath(report.id, documentDir);
			const result = await implementation(await readFile(filepath));

			await reportRepository.update(report.id, { result });
		} catch (e) {
			mainLogger.error(String(e));
		}
	}
}).catch(console.error);

function compileFilepath(reportId: string, documentDir?: string): string {
	const dir = documentDir ?? defaultDirs.fetcherFiles;

	return `${dir}/${reportId}`;
}

async function readFile(filepath: PathLike): Promise<string> {
	const file = await fs.readFile(filepath);

	return file.toString();
}
