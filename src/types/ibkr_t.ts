export type account_t = {
	id: string;
	accountAlias: string;
	currency: string;
}
export type accounts_t = account_t[]

export type status_t = {
	authenticated: boolean;
	connected: boolean;
}

export type position_t = {
	acctId: string;
	conid: number;
	contractDesc: string;
	position: number;
	mktPrice: number;
	mktValue: number;
	currency: string;
	avgCost: number;
	avgPrice: number;
	realizedPnl: number;
	unrealizedPnl: number;
	exchs: null;
	expiry: string;
	putOrCall: string;
	multiplier: number;
	strike: string;
	exerciseStyle: null,
	conExchMap: [],
	assetClass: string;
	undConid: number;
	model: string;
	baseMktValue: null,
	baseMktPrice: null,
	baseAvgCost: null,
	baseAvgPrice: null,
	baseRealizedPnl: null,
	baseUnrealizedPnl: null,
	incrementRules: Object[][],
	displayRule: {
		magnification: number;
		displayRuleStep: Object[][],
	},
	time: number;
	chineseName: string;
	allExchanges: string;
	listingExchange: string;
	countryCode: string;
	name: string;
	lastTradingDay: string
	group: string;
	sector: string;
	sectorGroup: string;
	ticker: string;
	type: string;
	hasOptions: boolean;
	fullName: string;
	isUS: boolean;
	isEventContract: boolean;
	pageSize: number;
}



