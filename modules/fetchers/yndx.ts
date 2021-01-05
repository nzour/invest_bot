import axios from 'axios';
import { JSDOM as Jsdom } from 'jsdom';
import { Logger } from "winston";
import { DocumentFileWithExternalLink, Fetcher } from "../core/types";

export class YandexFetcher implements Fetcher {
	constructor(private logger: Logger) {}

	async fetchAllDocuments(url: string): Promise<DocumentFileWithExternalLink[]> {
		const { data, status } = await axios.get(url);

		this.logger.debug(`Got ${status} from ${url} and data length: ${data.length}`);

		const { window: { document } } = new Jsdom(data);
		const wrappers = document.querySelectorAll('.financials-list .financials-list__item')

		this.logger.debug(`Parsed ${wrappers.length} wrappers by '.financials-list .financials-list__item'`);

		return [...wrappers.values()]
			.map(x => ({
				title: x.querySelector('.financials-list__title').textContent?.trim(),
				url: (x.querySelector('.docs-list__link') as HTMLAnchorElement).href?.trim()
			}))
			.filter(x => !!x.title && !!x.url);
	}
}
