import { FetcherIntegrationImplementation, Uuid } from "../../core/types";
import { assertDirectoryExists } from "../../core/functions";
import axios from 'axios';
import * as fs from "fs/promises";
import { PathLike } from "fs";
import { v4 as uuid } from 'uuid';
import { JSDOM as Jsdom } from 'jsdom';
import { Logger } from "winston";

type Document = { id: Uuid, title: string };
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

async function filterOnlyNotExisted(documents: PlainDocument[]): Promise<PlainDocument[]> {
	// TODO
	return documents;
}

async function saveDocumentToDatabase(document: Document): Promise<void> {
	// TODO
}


type Options = {
	directoryToSave: PathLike,
	mainUrl: string
	logger: Logger
}

export function createIntegration({ directoryToSave, mainUrl, logger }: Options): FetcherIntegrationImplementation {
	return async () => {
		try {
			await assertDirectoryExists(directoryToSave);
			logger.debug(`Directory '${directoryToSave}' exists`);

			const documents = await getAllDocuments(mainUrl, logger);

			// check if already added in database
			const documentsToProcess = await filterOnlyNotExisted(documents);

			logger.info(`Processing ${documentsToProcess.length} files`);
			logger.debug(`Processing ${documentsToProcess.length} files, [${documentsToProcess.map(d => d.title).join(', ')}]`);

			for (const { url, title } of documentsToProcess) {
				// todo: transactional
				const id = uuid();
				const document = { id, title };

				await downloadAndSaveFile(`${directoryToSave}/${id}.txt`, url, logger);
				await saveDocumentToDatabase(document);

				logger.debug(`Done ${document.title} (${document.id})`)
			}
		} catch (e) {
			logger.error(String(e));
		}
	};
}

