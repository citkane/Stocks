import type {
  AccountsRoot,
  AppRoot,
  InstrumentRow,
  InstrumentsRoot,
  MoneyString,
  PercentString,
  SelectAccount,
  SelectBroker,
  SelectComponent,
  SelectIndustry,
  SelectSector,
} from "@frontend/components";

export class Selector extends HTMLElement {
  constructor() {
    super();
  }
  protected get selector(): f.selector_i {
    if (frontend.cache.selector) return frontend.cache.selector;
    return (frontend.cache.selector = {
      money: {
        accounts: this.money_accounts,
        instruments: this.money_instruments,
      },
      root: {
        app: this.root_app,
        instrmnts: this.root_instrmnts,
        accnts: this.root_accnts,
      },
      filter: {
        select: {
          account: this.select_account,
          broker: this.select_broker,
          sector: this.select_sector,
          industry: this.select_industry,
        },
        selects: this.select_selects,
        selects_names: this.select_selects_names,
        shown_instrmnts: this.filter_shown_instrmnts,
      },
    });
  }

  private money_accounts = (base: HTMLElement) => ({
    cash: base.querySelector<MoneyString>(`[name="cash"]`)!,
    assets: base.querySelector<MoneyString>(`[name="assets_val"]`)!,
    total: base.querySelector<MoneyString>(`[name="total"]`)!,
  });
  private money_instruments = (base: HTMLElement) => ({
    traded: base.querySelector<MoneyString>('[name="traded_value"]')!,
    market: base.querySelector<MoneyString>('[name="market_value"]')!,
    r_pl: base.querySelector<MoneyString>('[name="r_pl"]')!,
    u_pl: base.querySelector<MoneyString>('[name="u_pl"]')!,
    fx_pl: base.querySelector<MoneyString>('[name="fx_pl"]')!,
    dividend: base.querySelector<MoneyString>('[name="dividend"]')!,
    div_est: base.querySelector<MoneyString>('[name="div_est"]')!,
    div_yield: base.querySelector<PercentString>('[name="div_yield"]')!,
    percent_u_pl: base.querySelector<PercentString>('[name="percent_pl"]')!,
  });

  private get root_app() {
    return document.querySelector<AppRoot>("app-root")!;
  }
  private get root_instrmnts() {
    return document.querySelector<InstrumentsRoot>("app-root instrmnts-root")!;
  }
  private get root_accnts() {
    return document.querySelector<AccountsRoot>("app-root accounts-root")!;
  }

  private get select_account() {
    return document.querySelector<SelectAccount>(
      "app-root instrmnts-root select-account",
    )!;
  }
  private get select_broker() {
    return document.querySelector<SelectBroker>(
      "app-root instrmnts-root select-broker",
    )!;
  }
  private get select_sector() {
    return document.querySelector<SelectSector>(
      "app-root instrmnts-root select-sector",
    )!;
  }
  private get select_industry() {
    return document.querySelector<SelectIndustry>(
      "app-root instrmnts-root select-industry",
    )!;
  }
  private get select_selects() {
    return document
      .querySelectorAll<SelectComponent>(
        "app-root instrmnts-root .filter.wrapper .inner > [filter]",
      )
      .values()
      .toArray();
  }
  private select_selects_names = () => {
    return this.select_selects.map((el) => el.getAttribute("name")!);
  };

  private filter_shown_instrmnts = () => {
    return document
      .querySelectorAll<InstrumentRow>(
        "app-root instrmnts-root instrmnt-row[shown]",
      )
      .values();
  };
}

type selector_t = InstanceType<typeof Selector>;
declare global {
  namespace f {
    interface selector_i {
      money: {
        accounts: selector_t["money_accounts"];
        instruments: selector_t["money_instruments"];
      };
      root: {
        app: selector_t["root_app"];
        instrmnts: selector_t["root_instrmnts"];
        accnts: selector_t["root_accnts"];
      };
      filter: {
        select: {
          account: selector_t["select_account"];
          broker: selector_t["select_broker"];
          sector: selector_t["select_sector"];
          industry: selector_t["select_industry"];
        };
        selects: selector_t["select_selects"];
        selects_names: selector_t["select_selects_names"];
        shown_instrmnts: selector_t["filter_shown_instrmnts"];
      };
    }
    type money_instruments_t = ReturnType<selector_t["money_instruments"]>;
  }
}
