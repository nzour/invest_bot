export type Company =
	| 'Yndx'
	| 'Mail'
	| 'Tcsg'
	| 'Ccl'
	| 'Bidu'
	| 'Rds.a'
	| 'F'
	| 'Pypl'
	| 'Bbby'
	| 'Vips'
	| 'Twtr'
	| 'Cvx'
	| 'Jpm'
	| 'Nke'
	| 'Ba'
	| 'Sq';


export const companyUrls: { [key in Company]: string } = {
	"Yndx": "https://ir.yandex/",
	"Mail": "https://corp.mail.ru/ru/investors/",
	"Tcsg": "https://tinkoffgroup.com/financials/quarterly-earnings/",
	"Ccl": "https://www.carnivalcorp.com/investor-relations/",
	"Bidu": "http://ir.baidu.com/",
	"Rds.a": "https://www.shell.com/investors.html",
	"F": "https://shareholder.ford.com/investors/overview/default.aspx",
	"Pypl": "https://investor.paypal-corp.com/",
	"Bbby": "http://bedbathandbeyond.gcs-web.com/",
	"Vips": "https://ir.vip.com/",
	"Twtr": "https://investor.twitterinc.com/home/default.aspx",
	"Cvx": "https://www.chevron.com/investors",
	"Jpm": "https://www.jpmorganchase.com/ir",
	"Nke": "https://investors.nike.com/Home/default.aspx",
	"Ba": "https://investors.boeing.com/investors/overview/default.aspx",
	"Sq": "https://squareup.com/us/en/about/investors"
};

export const companyNames: { [key in Company]: string } = {
	"Yndx": "Yandex NV",
	"Mail": "MailUp SpA",
	"Tcsg": "	TCS Group Holding PLC",
	"Ccl": "Carnival Corp",
	"Bidu": "Baidu Inc",
	"Rds.a": "Royal Dutch Shell plc ADR Class A",
	"F": "Ford Motor Company",
	"Pypl": "Paypal Holdings Inc",
	"Bbby": "Bed Bath & Beyond Inc.",
	"Vips": "Vipshop Holdings Ltd - ADR",
	"Twtr": "	Twitter Inc",
	"Cvx": "Chevron Corporation",
	"Jpm": "	JPMorgan Chase & Co.",
	"Nke": "	Nike Inc",
	"Ba": "Boeing Co",
	"Sq": "Square Inc"
};
