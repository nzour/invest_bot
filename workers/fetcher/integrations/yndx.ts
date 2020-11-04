import { PartialResult, Uuid } from "../../core/types";
import { assertDirectoryExists } from "../../core/functions";
import axios from 'axios';
import { Company } from "../../core/company";
import * as fs from "fs/promises";
import { PathLike } from "fs";
import { v4 as uuid } from 'uuid';
import { JSDOM as Jsdom } from 'jsdom';

type Document = { id: Uuid, title: string };
type PlainDocument = { title: string, url: string };

async function getAllDocuments(url: string): Promise<PlainDocument[]> {
	console.log('Started parsing');
	const result: PlainDocument[] = [];

	const { data } = await axios.get(url);
	const { window: { document } } = new Jsdom(data);
	const wrappers = document.querySelectorAll('div .nir-widget--news--addl-formats')

	for (const wrapper of wrappers) {

		const title = wrapper.children[0].textContent?.trim();
		const url = wrapper.querySelector('a')?.href?.trim();

		if ([title, url].some(x => !x)) {
			console.log(title);
			console.log(url);
			console.log();
			// TODO: LOG here
			continue;
		}

		console.log(`Done parsing ${title}`);

		result.push({ title, url });
	}

	return result;
}


async function downloadAndSaveFile(
	filepath: PathLike,
	url: string
): Promise<void> {
	const { data: buffer } = await axios.get(url, { responseType: 'arraybuffer' });

	// import doesn't work for not known issue
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const pdf = require('pdf-parse');
	const content = await pdf(buffer)

	await fs.appendFile(filepath, content.text, { mode: 0o777 });
}

async function filterOnlyNotExisted(documents: PlainDocument[]): Promise<PlainDocument[]> {
	// TODO
	return documents;
}

async function saveDocumentToDatabase(document: Document): Promise<void> {
	// TODO
}

export async function execute(company: Company, url: string): Promise<void> {
	const directory = `/tmp/invest_bot/${company}`;

	await assertDirectoryExists(directory);

	const documents = await getAllDocuments(url);
	const documentsToProcess = await filterOnlyNotExisted(documents);
	// ... check if already added in database

	const result: PartialResult<Document[], string[]> = {
		success: [],
		error: []
	};

	for (const { url, title } of documentsToProcess) {
		// todo: transactional
		const id = uuid();
		const document = { id, title };

		await downloadAndSaveFile(`${directory}/${id}.txt`, url);
		await saveDocumentToDatabase(document);

		console.log(`Done ${document.title} (${document.id})`);

		result.success.push(document);
	}
}

