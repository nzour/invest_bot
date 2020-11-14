import axios from 'axios';
import { JSDOM as Jsdom } from 'jsdom';
import { Logger } from "winston";
import { DocumentFileWithExternalLink, Fetcher } from "../../../common/types";

export class YandexFetcher implements Fetcher {
	constructor(private logger: Logger) {}

	async fetchAllDocuments(url: string): Promise<DocumentFileWithExternalLink[]> {
		const { data, status } = await axios.get(url);

		this.logger.debug(`Got ${status} from ${url} and data length: ${data.length}`);

		const { window: { document } } = new Jsdom(data);
		const wrappers = document.querySelectorAll('div .nir-widget--news--addl-formats')

		this.logger.debug(`Parsed ${wrappers.length} wrappers by 'div .nir-widget--news--addl-formats'`);

		return [...wrappers.values()]
			.map(x => ({
				title: x.children[0].textContent?.trim(),
				url: x.querySelector('a')?.href?.trim()
			}))
			.filter(x => !!x.title && !!x.url);
	}
}
