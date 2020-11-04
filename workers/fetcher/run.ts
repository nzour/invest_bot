#!/usr/bin/env ts-node-script

import { Company, companyUrls } from "../core/company";
import * as yandex from "./integrations/yndx";
import { interval } from "rxjs";
import { filter, tap } from "rxjs/operators";

const integrationsMap = new Map<Company, (company: string, url: string) => Promise<void>>();

integrationsMap.set('Yndx', yandex.execute);

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
	for (const [company, integration] of integrationsMap.entries()) {
		try {
			const url = companyUrls[company];

			await integration(company, url);
		} catch (e) {
			console.log(e);
			// TODO: LOG HERE
		}
	}
}

interval(10000) // every 10 seconds
	.pipe(
		filter(() => !isLocked),
	)
	.subscribe(async () => await withLock(runAllIntegrations));

