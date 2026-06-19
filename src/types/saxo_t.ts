import type { BrokerSaxo as Saxo_b } from "@backend/brokers";
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

      type data_t<T> = {
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
          Currency: string;
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
          ExposureCurrency: string;
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
        AccountCurrency: string;
        AccountCurrencyDecimals: number;
        AccountId: string;
        Amount: number;
        AmountClose: number;
        AmountOpen: number;
        AssetType: string;
        ClientCurrency: string;
        ClosePositionId: string;
        ClosePrice: number;
        CloseType: string;
        ExchangeDescription: string;
        InstrumentCurrency: string;
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
        CurrencyCode: string;
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
        AccountCurrency: string;
        AccountCurrencyDecimals: number;
        AccountId: string;
        AdjustedTradeDate: string;
        Amount: number;
        AssetType: string;
        BookedAmountAccountCurrency: number;
        BookedAmountClientCurrency: number;
        BookedAmountUSD: number;
        ClientCurrency: string;
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
        TradeBarrierEventStatus: boolean;
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

      //type accounts_t = {
      //  Data: account_t[];
      //  __next?: string;
      //};
      //type data_t<T> = {
      //  Data: T[];
      //  __count: number;
      //  __next?: string;
      //};

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
        Currency: string;
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
          Currency: string;
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
      type balance_t = {
        CalculationReliability: string;
        CashAvailableForTrading: number;
        CashBalance: number;
        CashBlocked: number;
        CashBlockedFromWithdrawal: number;
        ChangesScheduled: boolean;
        ClosedPositionsCount: number;
        CollateralAvailable: number;
        CollateralCreditValue: {
          Line: number;
          UtilizationPct: number;
        };
        CorporateActionUnrealizedAmounts: number;
        CostToClosePositions: number;
        Currency: string;
        CurrencyDecimals: number;
        ExtendedTradingHoursData: {
          CostToClosePositions: number;
          InitialMarginUncertainty: number;
          MaintenanceMarginUncertainty: number;
          MarginAvailableForTrading: number;
          MarginUsedByCurrentPositions: number;
          NonMarginPositionsValue: number;
          TotalValue: number;
          UncertaintyValue: null;
          UnrealizedMarginClosedProfitLoss: number;
          UnrealizedMarginOpenProfitLoss: number;
          UnrealizedMarginProfitLoss: number;
          UnrealizedPositionsValue: number;
          UnrealizedPositionsValueExcludingCostToClosePositions: number;
        };
        FinancingAccruals: number;
        InitialMargin: {
          CollateralAvailable: number;
          CollateralCreditValue: {
            Line: number;
            UtilizationPct: number;
          };
          MarginAvailable: number;
          MarginCollateralNotAvailable: number;
          MarginCollateralNotAvailableIncludingCostToClosePositions: number;
          MarginUsedByCurrentPositions: number;
          MarginUtilizationPct: number;
          NetEquityForMargin: number;
          OtherCollateralDeduction: number;
        };
        IsPortfolioMarginModelSimple: boolean;
        MarginAndCollateralUtilizationPct: number;
        MarginAvailableForTrading: number;
        MarginCollateralNotAvailable: number;
        MarginCollateralNotAvailableDetail: {
          InitialFxHaircut: number;
          InstrumentCollateralDetails: {
            AssetType: string;
            ContributingAssetTypes: string[];
            Description: string;
            InitialCollateral: number;
            InitialCollateralNotAvailable: number;
            InitialConcentrationDeduction: number;
            MaintenanceCollateral: number;
            MaintenanceCollateralNotAvailable: number;
            MaintenanceConcentrationDeduction: number;
            MarketValue: number;
            Symbol: string;
            Uic: number;
          }[];

          MaintenanceFxHaircut: number;
        };
        MarginCollateralNotAvailableIncludingCostToClosePositions: number;
        MarginExposureCoveragePct: number;
        MarginNetExposure: number;
        MarginUsedByCurrentPositions: number;
        MarginUtilizationPct: number;
        NetEquityForMargin: number;
        NetPositionsCount: number;
        NonMarginPositionsValue: number;
        OpenIpoOrdersCount: number;
        OpenPositionsCount: number;
        OptionPremiumsMarketValue: number;
        OrdersCount: number;
        OtherCollateral: number;
        SettlementValue: number;
        SpendingPower: number;
        SpendingPowerDetail: {
          Current: number;
        };
        SrdSpendingPower: number;
        TotalValue: number;
        TransactionsNotBooked: number;
        TriggerOrdersCount: number;
        UnrealizedMarginClosedProfitLoss: number;
        UnrealizedMarginOpenProfitLoss: number;
        UnrealizedMarginProfitLoss: number;
        UnrealizedPositionsValue: number;
        UnrealizedPositionsValueExcludingCostToClosePositions: number;
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

      type client_t = {
        AccountValueProtectionLimit: number;
        AllowedNettingProfiles: string[];
        AllowedTradingSessions: string;
        ClientId: string;
        ClientKey: string;
        ClientType: string;
        ContractOptionsTradingProfile: string;
        CountryOfResidence: string;
        CurrencyDecimals: number;
        DefaultAccountId: string;
        DefaultAccountKey: string;
        DefaultCurrency: string;
        ForceOpenDefaultValue: boolean;
        IsMarginTradingAllowed: boolean;
        IsVariationMarginEligible: boolean;
        LegalAssetTypes: string[];
        LegalAssetTypesAreIndicative: boolean;
        MarginCalculationMethod: string;
        MarginMonitoringMode: string;
        MutualFundsCashAmountOrderCurrency: string;
        Name: string;
        PartnerPlatformId: string;
        PositionNettingMethod: string;
        PositionNettingMode: string;
        PositionNettingProfile: string;
        ReduceExposureOnly: boolean;
        SecurityLendingEnabled: string;
        SupportsAccountValueProtectionLimit: boolean;
      };
      type positn_det_t = {
        AssetType: string;
        CurrencyCode: string;
        Description: string;
        ExchangeId: string;
        GroupId: number;
        Identifier: number;
        IssuerCountry: string;
        PrimaryListing: number;
        SummaryType: string;
        Symbol: string;
        TradableAs: string[];
      };
    }
  }
}
