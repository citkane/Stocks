export type auth_code_t = {
	code: string;
	state: string
}
export type auth_token_t = {
	access_token: string;
	refresh_token: string;
}

export type Data_t<T> = { Data: T };
export type account_t = {
	AccountGroupKey: string;
	AccountId: string;
	AccountKey: string;
	AccountSubType: string;
	AccountType: string;
	AccountValueProtectionLimit: number;
	Active: boolean;
	CanUseCashPositionsAsMarginCollateral: boolean;
	CfdBorrowingCostsActive: boolean;
	ClientId: string;
	ClientKey: string;
	CreationDate: string;
	Currency: currency_t;
	CurrencyDecimals: number;
	DirectMarketAccess: boolean;
	ExternalReference: string;
	FractionalOrderEnabled: boolean;
	FractionalOrderEnabledAssetTypes: [];
	IndividualMargining: boolean;
	IsCurrencyConversionAtSettlementTime: boolean;
	IsMarginTradingAllowed: boolean;
	IsShareable: boolean;
	IsTrialAccount: boolean;
	LegalAssetTypes: string[];
	ManagementType: string;
	MarginCalculationMethod: string;
	MarginLendingEnabled: string;
	PortfolioBasedMarginEnabled: boolean;
	Sharing: string[];
	SupportsAccountValueProtectionLimit: boolean;
	UseCashPositionsAsMarginCollateral: boolean;
}

export type position_t = {
	PositionId: string;
	DisplayAndFormat: {
		"Currency": currency_t;
		"Decimals": number;
		"Description": string;
		"Format": string;
		"Symbol": string
	}
}
export type accounts_t = {
	Data: account_t[]
	__next?: string
}
export type positions_t = {
	Data: position_t[]
	__next?: string
}
