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
import { Presets, SingleBar } from "cli-progress";

setupDotenv();

const args = minimist(process.argv);
const logDir = args['log-dir'];
const reportDir = args['report-dir'];
const enabledProgress = !args['no-progress'];
const help = args['h'] ?? args['help'];

if (help) {
	printHelp();
	process.exit(1);
}

export type ParserImplementation = (reportContent: string) => Promise<string>;

const mainLogger = createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.parser('main'));
const implementationsMap = new Map<Company, ParserImplementation>();

implementationsMap.set('Yndx', yandex.createImplementation({
	logger: createLogger(logDir ? `${logDir}/Yndx` : defaultDirs.logs.parser('Yndx'))
}));

withLock(lockers.usingTempDir('parser'), async () => {
	const connection = await createConnection('default');
	const reportRepository = await connection.getRepository(ReportEntity);
	const toProcess = await reportRepository.find({ result: null });

	const bar = new SingleBar({} , Presets.shades_classic);

	if (toProcess.length) {
		mainLogger.info(`Processing ${toProcess.length} reports...`);
		enabledProgress && bar.start(toProcess.length, 0);
	} else {
		mainLogger.info('There is nothing to process, terminating...');
	}

	for (const report of toProcess) {
		try {
			const implementation = implementationsMap.get(report.company);

			if (!implementation) {
				throw new Error(`Could not find implementation for '${report.company}'`);
			}

			const filepath = compileFilepath(report.id, reportDir);
			const result = await implementation(await readFile(filepath));

			await reportRepository.update(report.id, { result });
		} catch (e) {
			mainLogger.error(String(e));
		} finally {
			enabledProgress && bar.increment();
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

function printHelp(): void {
	console.log(`
	Looking for non-processed reports then trying to parse and save the result.

	--help	-h	Shows this message.
	--log-dir	Defines directory for logs.
	--report-dir	Defines directory for fetched reports.
	--no-progress	Disables console progress bar.
	`);
}
