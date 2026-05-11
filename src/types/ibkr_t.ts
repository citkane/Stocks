import type { BrokerIbkr as Ibkr_b } from "@backend/brokers";
import type { Ibkr as Ibkr_f } from "@frontend/app/brokers";

declare global {
  namespace backend {
    type Ibkr_t = Ibkr_b;
  }
  namespace frontend {
    type Ibkr_t = Ibkr_f;
  }
  namespace b {
    namespace i {
      type status_t = {
        authenticated: boolean;
        connected: boolean;
      };

      type account_t = {
        id: string;
        "PrepaidCrypto-Z": boolean;
        "PrepaidCrypto-P": boolean;
        brokerageAccess: boolean;
        accountId: string;
        accountVan: currency_t;
        accountTitle: string;
        displayName: string;
        accountAlias?: string;
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
      };

      type positn_t = {
        acctId: string;
        conid: number;
        contractDesc: string;
        position: number;
        mktPrice: number;
        mktValue: number;
        currency: currency_t;
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
        lastTradingDay: string;
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
      };

      type fx_rate_t = { rate: number };

      type transaction_type_t =
        | "Buy"
        | "Sell"
        | "Transfer"
        | "Dividend Payment";
      type transaction_t = {
        uid?: string;
        cur: currency_t;
        date: string;
        rawDate: string;
        fxRate: number;
        pr?: number;
        qty?: number;
        acctid: string;
        amt: number;
        conid: number;
        type: b.i.transaction_type_t;
        desc: string;
        isRealTime?: boolean;
      };
      type transactions_t = {
        nd: number;
        rpnl: {
          data: [];
          amt: number;
        };
        currency: currency_t;
        from: number;
        id: string;
        to: number;
        transactions: transaction_t[];
      };
      type authstatus_t = {
        authenticated: boolean;
        established: boolean;
        competing: boolean;
        connected: boolean;
        message: string;
        MAC: string;
        serverInfo: {
          serverName: string;
          serverVersion: string;
        };
        hardware_info: string;
      };
      type tickle_t = {
        session: string;
        ssoExpires: number;
        collission: boolean;
        userId: number;
        hmds: {
          error: string;
        };
        iserver: {
          authStatus: authstatus_t;
        };
      };

      type bar_data_t = {
        serverId: string;
        symbol: string;
        text: string;
        priceFactor: number;
        chartAnnotations: string;
        startTime: string;
        high: string;
        low: string;
        timePeriod: string;
        barLength: number;
        mdAvailability: string;
        mktDataDelay: number;
        outsideRth: boolean;
        volumeFactor: number;
        priceDisplayRule: number;
        priceDisplayValue: string;
        negativeCapable: boolean;
        messageVersion: number;
        data: {
          o: number;
          c: number;
          h: number;
          l: number;
          v: number;
          t: number;
        }[];
        points: number;
        travelTime: number;
      };
      type positions_data_t = {
        transactions: { [key: number]: b.i.transaction_t[] };
        positions: {
          frontend: globalThis.transctn_t[];
          broker: b.i.positn_t[];
        };
      };

      type exchg_t = {
        id: string;
        name: string;
        country: string;
        region: string;
        assets: string;
        country_code: string;
      };
      type balance_t = {
        commoditymarketvalue: number;
        futuremarketvalue: number;
        settledcash: number;
        exchangerate: number;
        sessionid: number;
        cashbalance: number;
        corporatebondsmarketvalue: number;
        warrantsmarketvalue: number;
        netliquidationvalue: number;
        interest: number;
        unrealizedpnl: number;
        stockmarketvalue: number;
        moneyfunds: number;
        currency: currency_t;
        realizedpnl: number;
        funds: number;
        acctcode: string;
        issueroptionsmarketvalue: number;
        key: string;
        timestamp: number;
        severity: number;
        stockoptionmarketvalue: number;
        futuresonlypnl: number;
        tbondsmarketvalue: number;
        futureoptionmarketvalue: number;
        cashbalancefxsegment: number;
        secondkey: currency_t;
        tbillsmarketvalue: number;
        endofbundle: number;
        dividends: number;
      };
    }
  }
}
