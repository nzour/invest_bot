export class TextMatcher {
	static readonly EMPTY_LINE = '\n\n';
	static readonly EOL = '\n';

	constructor(private text: string) {}

	static from(text: string) {
		return new TextMatcher(text);
	}

	search(pattern: string | RegExp) {
		const index = this.text.search(pattern);
		this.text = this.text.substr(index);

		return this;
	}

	takeUntil(pattern: string, nth = 1) {
		const index = TextMatcher.nthIndex(this.text, pattern, nth);
		this.text = this.text.substr(0, index);

		return this;
	}

	noEmptyLines() {
		this.text = this.text.replace(TextMatcher.EMPTY_LINE, TextMatcher.EOL);

		return this;
	}

	onlyLinesWith(pattern: string) {
		this.text = this.text.split(TextMatcher.EOL)
			.filter(line => -1 !== line.indexOf(pattern))
			.join(TextMatcher.EOL);

		return this;
	}

	trimEachLine() {
		this.text = this.text.split(TextMatcher.EOL)
			.map(line => line.trim())
			.join(TextMatcher.EOL);

		return this;
	}

	removeNonASCIISymbols() {
		this.text = [...this.text]
			.filter(char => {
				const code = char.charCodeAt(0);

				return code >= 0 && code <= 128;
			})
			.join('');

		return this;
	}

	private static nthIndex(text, pattern, nth) {
		const length = text.length;
		let i = -1;

		while (nth-- && i++ < length) {
			i = text.indexOf(pattern, i);

			if (i < 0) {
				break;
			}
		}

		return i;
	}

	toString() {
		return this.text;
	}
}
