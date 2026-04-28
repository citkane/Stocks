import type { Saxo as Saxo_b } from "@backend/brokers";
import type { Saxo as Saxo_f } from "@frontend/app/brokers";

declare global {
  namespace backend {
    type Saxo_t = Saxo_b;
  }
  namespace frontend {
    type Saxo_t = Saxo_f;
  }
  namespace b {
    namespace s {
      type auth_code_t = {
        code: string;
        state: string;
      };
      type auth_token_t = {
        access_token: string;
        refresh_token: string;
      };

      type data_envelope_t<T> = {
        __next?: string;
        __count: number;
        Data: T[];
        MaxRows?: number;
      };
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
        DisplayName?: string;
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

      type positn_t = {
        DisplayAndFormat: {
          Currency: currency_t;
          Decimals: number;
          Description: string;
          Format: string;
          Symbol: string;
        };
        Exchange: {
          Description: string;
          ExchangeId: string;
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

      type positn_closed_t = {
        AccountCurrency: currency_t;
        AccountCurrencyDecimals: number;
        AccountId: string;
        Amount: number;
        AmountClose: number;
        AmountOpen: number;
        AssetType: string;
        ClientCurrency: currency_t;
        ClosePositionId: string;
        ClosePrice: number;
        CloseType: string;
        ExchangeDescription: string;
        InstrumentCurrency: currency_t;
        InstrumentDescription: string;
        InstrumentSymbol: string;
        OpenPositionId: string;
        OpenPrice: number;
        PnLAccountCurrency: number;
        PnLClientCurrency: number;
        PnLUSD: number;
        TotalBookedOnClosingLegAccountCurrency: number;
        TotalBookedOnClosingLegClientCurrency: number;
        TotalBookedOnClosingLegUSD: number;
        TotalBookedOnOpeningLegAccountCurrency: number;
        TotalBookedOnOpeningLegClientCurrency: number;
        TotalBookedOnOpeningLegUSD: number;
        TradeDate: string;
        TradeDateClose: string;
        TradeDateOpen: string;
        UnderlyingInstrumentDescription: string;
        UnderlyingInstrumentSymbol: string;
      };

      type instrument_t = {
        AffiliateInfoRequired: boolean;
        AmountDecimals: number;
        AssetType: string;
        CurrencyCode: currency_t;
        DefaultAmount: number;
        DefaultSlippage: number;
        DefaultSlippageType: string;
        Description: string;
        Exchange: {
          CountryCode: string;
          ExchangeId: string;
          Name: string;
          TimeZoneId: string;
        };
        Format: {
          Decimals: number;
          OrderDecimals: number;
        };
        FractionalMinimumLotSize: number;
        GroupId: number;
        IncrementSize: number;
        IsBarrierEqualsStrike: boolean;
        IsComplex: boolean;
        IsExtendedTradingHoursEnabled: boolean;
        IsOcoOrderSupported: boolean;
        IsPEAEligible: boolean;
        IsPEASMEEligible: boolean;
        IsRedemptionByAmounts: boolean;
        IsSwitchBySameCurrency: boolean;
        IsSystematicInternaliser: boolean;
        IsTradable: boolean;
        LotSize: number;
        LotSizeType: string;
        MinimumLotSize: number;
        MinimumTradeSize: number;
        NonTradableReason: string;
        OrderDistances: {
          EntryDefaultDistance: number;
          EntryDefaultDistanceType: string;
          LimitDefaultDistance: number;
          LimitDefaultDistanceType: string;
          StopLimitDefaultDistance: number;
          StopLimitDefaultDistanceType: string;
          StopLossDefaultDistance: number;
          StopLossDefaultDistanceType: string;
          StopLossDefaultEnabled: boolean;
          StopLossDefaultOrderType: string;
          TakeProfitDefaultDistance: number;
          TakeProfitDefaultDistanceType: string;
          TakeProfitDefaultEnabled: boolean;
        };
        PriceCurrency: string;
        PriceToContractFactor: number;
        PrimaryListing: number;
        RelatedInstruments: {
          AssetType: string;
          Uic: number;
        }[];

        StandardAmounts: number[];
        SupportedOrderTriggerPriceTypes: string[];
        SupportedOrderTypes: string[];
        SupportedStrategies: string[];
        Symbol: string;
        TickSizeScheme: {
          DefaultTickSize: number;
          Elements: {
            HighPrice: number;
            TickSize: number;
          }[];
        };
        TradableAs: string[];
        TradableOn: string[];
        TradingSignals: string;
        TradingStatus: string;
        Uic: number;
        UnderlyingTypeCategory: string;
      };

      type trade_t = {
        AccountCurrency: currency_t;
        AccountCurrencyDecimals: number;
        AccountId: string;
        AdjustedTradeDate: string;
        Amount: number;
        AssetType: string;
        BookedAmountAccountCurrency: number;
        BookedAmountClientCurrency: number;
        BookedAmountUSD: number;
        ClientCurrency: currency_t;
        Direction: string;
        ExchangeDescription: string;
        FinancingLevel: number;
        InstrumentCategoryCode: string;
        InstrumentCurrencyDecimal: number;
        InstrumentDescription: string;
        InstrumentSymbol: string;
        IssuerName: string;
        OrderId: string;
        Price: number;
        ResidualValue: number;
        SpreadCostAccountCurrency: number;
        SpreadCostClientCurrency: number;
        SpreadCostUSD: number;
        StopLoss: number;
        Strike: number;
        Strike2: number;
        ToolId: string;
        ToOpenOrClose: string;
        TradeBarrierEventStatus: false;
        TradeDate: string;
        TradedValue: number;
        TradeEventType: string;
        TradeExecutionTime: string;
        TradeId: string;
        TradeType: string;
        Uic: number;
        UnderlyingInstrumentDescription: string;
        UnderlyingInstrumentSymbol: string;
        ValueDate: string;
        Venue: string;
      };

      type accounts_t = {
        Data: account_t[];
        __next?: string;
      };
      type data_t<T> = {
        Data: T[];
        __count: number;
        __next?: string;
      };

      type transaction_t = {
        AccountId: string;
        BkRecordId: number;
        BookedAmount: number;
        BookingId: string;
        Bookings: {
          AmountType: string;
          AmountTypeDisplay: string;
          AmountTypeId: string;
          BookedAmount: number;
          BookingId: string;
          ConversionCost: number;
          ConversionRate: number;
          ConversionRateAccountToClientCurrency: number;
          CostClass: string;
          CostSubClass: string;
          Date: string;
          ValueDate: string;
        }[];
        Cash: {
          After: {
            Available: number;
            Balance: number;
            Blocked: number;
          };
          Before: {
            Available: number;
            Balance: number;
            Blocked: number;
          };
        };
        ConversionCost: number;
        ConversionRate: number;
        Currency: currency_t;
        CurrencyDecimals: number;
        Date: string;
        Event:
          | "Deposit"
          | "Withdrawal"
          | "Cash Dividend"
          | "Buy"
          | "Sell"
          | "VAT"
          | "Custody Fee"
          | "Interest"
          | "Final Maturity";
        EventDisplay: string;
        FrontOfficeTradeId: string;
        FundingSubType: string;
        FundingSubTypeDisplay: string;
        Instrument: {
          AssetType: "Cash" | "Stock";
          Currency: currency_t;
          CurrencyDecimals: number;
          Description: string;
          ExchangeDescription: string;
          ISINCode: string;
          IssuerName: string;
          ResidualValue: number;
          Symbol: string;
          Uic: number;
        };
        IsAdvisedTrade: boolean;
        IsIntradayData: boolean;
        IsReversal: boolean;
        OriginalTradeId: number;
        PositionId: string;
        RelatedPositionId: string;
        RelatedTradeId: string;
        TotalCost: number;
        TradeId?: string;
        Trades: {
          AdjustedTradeDate: string;
          Direction: string;
          ExchangeName: string;
          IsSaxoCounterpart: boolean;
          OrderId: string;
          PositionId: string;
          Price: number;
          SpreadCost: number;
          StopLoss: number;
          ToolId: string;
          ToOpenOrClose: "ToOpen" | "ToClose";
          ToOpenOrCloseDisplay: string;
          TradeBarrierEventStatus: boolean;
          TradedQuantity: number;
          TradedValue: number;
          TradeEventType: "Bought" | "Sold";
          TradeEventTypeDisplay: string;
          TradeExecutionTime: string;
          TradeId: string;
          TradeType: string;
          Venue: string;
        }[];
        TransactionType:
          | "CashTransfer"
          | "CashAmount"
          | "CorporateAction"
          | "Trade";
        TransactionTypeDisplay: string;
        UnderlyingInstrument: {
          CurrencyDecimals: number;
          Description: string;
          Symbol: string;
          Uic: number;
        };
        ValueDate: string;
      };
      type transactions_t = {
        Data: transaction_t[];
        __count: number;
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

      type exchg_t = {
        AllDay: boolean;
        CountryCode: string;
        Currency: string;
        ExchangeId: string;
        ExchangeSessions: {
          EndTime: string;
          StartTime: string;
          State: string;
        }[];
        IsoMic?: string;
        Mic: string;
        Name: string;
        OperatingMic: string;
        PriceSourceName: string;
        TimeZone: number;
        TimeZoneAbbreviation: string;
        TimeZoneOffset: string;
      };
    }
  }
}
