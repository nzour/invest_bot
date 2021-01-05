#!/usr/bin/env ts-node-script

import { Company } from "../modules/core/company";
import { createLogger, defaultDirs } from "../modules/core/functions";
import * as yandex from '../modules/parsers/yndx';
import { lockers, withLock } from "../modules/core/locker";
import { config as setupDotenv } from 'dotenv';
import * as minimist from "minimist";

setupDotenv();

const args = minimist(process.argv);
const logDir = args['log-dir'];
const documentDir = args['documents-dir'];

export type ParserImplementation = () => Promise<string>;

const mainLogger = createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.parser('main'));
const implementationsMap = new Map<Company, ParserImplementation>();

implementationsMap.set('Yndx', yandex.createImplementation({
	logger: createLogger(logDir ? `${logDir}/main` : defaultDirs.logs.parser('Yndx')),
	documentsDirectory: documentDir ?? defaultDirs.fetcherFiles
}));

withLock(lockers.usingTempDir('parser'), async () => {
	for (const [name, implantation] of implementationsMap.entries()) {
		try {
			mainLogger.info(`Started implementation ${name}`);

			await implantation();
		} catch (e) {
			// only unhandled exception may occur here
			mainLogger.error(String(e));
		}
	}
}).catch(console.error);


