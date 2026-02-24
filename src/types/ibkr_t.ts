export type status_t = {
	authenticated: boolean;
	connected: boolean;
}

export type account_t = {
	id: string;
	"PrepaidCrypto-Z": boolean;
	"PrepaidCrypto-P": boolean;
	brokerageAccess: boolean;
	accountId: string;
	accountVan: currency_t;
	accountTitle: string;
	displayName: string;
	accountAlias: string;
	accountStatus: number;
	currency: currency_t;
	type: string;
	tradingType: string;
	businessType: string;
	category: string;
	ibEntity: string;
	faclient: boolean;
	clearingStatus: string;
	covestor: boolean;
	noClientTrading: boolean;
	trackVirtualFXPortfolio: boolean;
	acctCustType: string;
	parent: {
		mmc: [];
		accountId: string;
		isMParent: boolean;
		isMChild: boolean;
		isMultiplex: boolean;
	};
	desc: string;
}

export type accounts_t = account_t[]

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
	exerciseStyle: null;
	conExchMap: [];
	assetClass: string;
	undConid: number;
	model: string;
	baseMktValue: null;
	baseMktPrice: null;
	baseAvgCost: null;
	baseAvgPrice: null;
	baseRealizedPnl: null;
	baseUnrealizedPnl: null;
	incrementRules: Object[][];
	displayRule: {
		magnification: number;
		displayRuleStep: Object[][];
	};
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



