import { assertDirectoryExists } from "../../core/functions";
import axios from 'axios';
import * as fs from "fs/promises";
import { PathLike } from "fs";
import { v4 as uuid } from 'uuid';
import { JSDOM as Jsdom } from 'jsdom';
import { Logger } from "winston";
import { DocumentsStorage } from "../../../common/documents-storage";
import { FetcherImplementation } from "../../../bin/fetcher";

type PlainDocument = { title: string, url: string };

async function getAllDocuments(url: string, logger: Logger): Promise<PlainDocument[]> {
	logger.info('Started parsing');

	const result: PlainDocument[] = [];

	const { data, status } = await axios.get(url);

	logger.debug(`Got ${status} from ${url} and data length: ${data.length}`);

	const { window: { document } } = new Jsdom(data);
	const wrappers = document.querySelectorAll('div .nir-widget--news--addl-formats')

	logger.debug(`Parsed ${wrappers.length} wrappers by 'div .nir-widget--news--addl-formats'`);

	for (const [key, wrapper] of wrappers.entries()) {
		const title = wrapper.children[0].textContent?.trim();
		const url = wrapper.querySelector('a')?.href?.trim();

		if ([title, url].some(x => !x)) {
			logger.warning(`Not valid wrapper found (key: ${key}), (title: ${title}) (url: ${url})`);
			continue;
		}

		result.push({ title, url });
	}

	logger.info(`Done parsing ${result.length}`);
	logger.debug(`Done parsing ${result.length}, ${result.map(r => `{title: ${r.title}, url: ${r.url}}`).join(', ')}`);

	return result;
}

async function downloadAndSaveFile(
	filepath: PathLike,
	url: string,
	logger: Logger,
): Promise<void> {
	logger.info(`Downloading file ${filepath} from ${url}`);

	const { data: buffer, status } = await axios.get(url, { responseType: 'arraybuffer' });

	logger.debug(`Got ${status} from ${url}`);

	// import doesn't work for not known issue
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const pdf = require('pdf-parse');
	const content = await pdf(buffer)

	await fs.appendFile(filepath, content.text, { mode: 0o777 });

	logger.info(`Done saving ${filepath}, with length: ${content.text.length}`);
}

type Options = {
	storage: DocumentsStorage,
	directoryToSave: PathLike,
	mainUrl: string
	logger: Logger
}

export function createIntegration({ storage, directoryToSave, mainUrl, logger }: Options): FetcherImplementation {
	return async () => {
		try {
			await assertDirectoryExists(directoryToSave);
			logger.debug(`Directory '${directoryToSave}' exists`);

			const documents = await getAllDocuments(mainUrl, logger);

			const titleOfDocumentsToProcess = await storage.findNonExistentDocuments(documents.map(d => d.title));

			logger.info(`Processing ${titleOfDocumentsToProcess.length} files`);
			titleOfDocumentsToProcess.length && logger.debug(`Processing ${titleOfDocumentsToProcess.length} files, [${titleOfDocumentsToProcess.join(', ')}]`);

			for (const title of titleOfDocumentsToProcess) {
				const url = documents.find(d => d.title === title).url;

				// todo: transactional
				const id = uuid();
				const document = { id, title };

				await downloadAndSaveFile(`${directoryToSave}/${id}.txt`, url, logger);
				await storage.save(document);

				logger.debug(`Done ${document.title} (${document.id})`)
			}
		} catch (e) {
			logger.error(String(e));
		}
	};
}

