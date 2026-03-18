import type { Saxo as Saxo_b } from "@backend/brokers";
import type { Saxo as Saxo_f } from "@frontend/app/brokers";

declare global {
  namespace backend {
    type Saxo_t = Saxo_b;
  }
  namespace frontend {
    type Saxo_t = Saxo_f;
  }
  namespace saxo_t {
    type auth_code_t = {
      code: string;
      state: string;
    };
    type auth_token_t = {
      access_token: string;
      refresh_token: string;
    };

    type Data_t<T> = { Data: T };
    type account_t = {
      AccountGroupKey: string;
      AccountId: string;
      AccountKey: string;
      AccountSubType: string;
      AccountType: string;
      Active: boolean;
      CanUseCashPositionsAsMarginCollateral: boolean;
      CfdBorrowingCostsActive: boolean;
      ClientId: number;
      ClientKey: string;
      CreationDate: string;
      Currency: string;
      CurrencyDecimals: number;
      DirectMarketAccess: boolean;
      DisplayName: string;
      ExternalReference: string;
      FractionalOrderEnabled: boolean;
      FractionalOrderEnabledAssetTypes: string[];
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
    };

    type position_t = {
      DisplayAndFormat: {
        Currency: currency_t;
        Decimals: number;
        Description: string;
        Format: string;
        Symbol: string;
      };
      Exchange: {
        Description: string;
        ExchangeId: exchanges_t;
        IsOpen: boolean;
        TimeZoneId: string;
      };
      NetPositionId: string;
      PositionBase: {
        AccountId: string;
        AccountKey: string;
        Amount: number;
        AssetType: string;
        CanBeClosed: boolean;
        ClientId: string;
        CloseConversionRateSettled: boolean;
        CorrelationKey: string;
        ExecutionTimeOpen: string;
        IsForceOpen: boolean;
        IsMarketOpen: boolean;
        LockedByBackOffice: boolean;
        OpenBondPoolFactor: 1;
        OpenPrice: number;
        OpenPriceIncludingCosts: number;
        RelatedOpenOrders: [];
        SourceOrderId: string;
        Status: string;
        Uic: number;
        ValueDate: string;
      };
      PositionId: string;
      PositionView: {
        Ask: number;
        Bid: number;
        CalculationReliability: string;
        ConversionRateCurrent: number;
        ConversionRateOpen: number;
        CurrentBondPoolFactor: number;
        CurrentPrice: number;
        CurrentPriceDelayMinutes: number;
        CurrentPriceLastTraded: string;
        CurrentPriceType: string;
        Exposure: number;
        ExposureCurrency: currency_t;
        ExposureInBaseCurrency: number;
        InstrumentPriceDayPercentChange: number;
        MarketState: string;
        MarketValue: number;
        MarketValueInBaseCurrency: number;
        MarketValueOpen: number;
        MarketValueOpenInBaseCurrency: number;
        ProfitLossOnTrade: number;
        ProfitLossOnTradeInBaseCurrency: number;
        ProfitLossOnTradeIntraday: number;
        ProfitLossOnTradeIntradayInBaseCurrency: number;
        TradeCostsTotal: number;
        TradeCostsTotalInBaseCurrency: number;
      };
    };
    type accounts_t = {
      Data: account_t[];
      __next?: string;
    };
    type positions_t = {
      Data: position_t[];
      __next?: string;
    };

    type bar_data_t = {
      Data: {
        Close: number;
        High: number;
        Interest: number;
        Low: number;
        Open: number;
        Time: string;
        Volume: number;
      }[];
    };
  }
}
