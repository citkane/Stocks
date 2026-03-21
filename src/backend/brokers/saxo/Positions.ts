import { Global } from "backend";

type pos_t = saxo_t.position_t;

const paging_top = 100;
const { client_key } = conf.saxo;

export class Positions extends Global {
  constructor() {
    super();
  }
  public update = (skip = 0, positions: pos_t[] = []): Promise<pos_t[]> =>
    this.saxo
      .fetch<saxo_t.positions_t>(this.endpoints.positions(skip))
      .then((data) =>
        !!data.__next
          ? this.update(skip + paging_top, [...positions, ...data.Data])
          : [...positions, ...data.Data],
      );

  private endpoints = {
    positions: (skip: number) => {
      const params = [
        `ClientKey=${client_key}`,
        `$top=${paging_top}`,
        `$skip=${skip}`,
        "fieldGroups=DisplayAndFormat,ExchangeInfo,PositionView,PositionBase",
      ].join("&");
      return `${this.api_url}/positions?${params}`;
    },
    position: (id: string) =>
      `${this.api_url}/positions/${id}?ClientKey=${client_key}`,
  };
  private get api_url() {
    return util.url.saxo.api;
  }
}

export class Position extends Global {
  constructor(private position: saxo_t.position_t) {
    super();
  }

  async translate(): Promise<position_t> {
    const p = this.position;
    const { ExchangeId } = p.Exchange;
    const { Currency, Symbol, Description } = p.DisplayAndFormat;
    const { ConversionRateOpen, CurrentPrice } = p.PositionView;
    const { Uic, AccountId, Amount, ExecutionTimeOpen, ValueDate, OpenPrice } =
      p.PositionBase;
    const { ticker, exchange, description } = util.string.format_ticker(
      ExchangeId,
      Symbol,
      Description,
    );
    const _date =
      ExecutionTimeOpen.split("T")[0] === ValueDate.split("T")[0]
        ? ExecutionTimeOpen
        : ValueDate;
    return {
      p_id: `saxo_${p.PositionId}`,
      con_id: Uic.toString(),
      broker: "saxo",
      a_id: AccountId,
      description,
      ticker,
      currency: Currency,
      exchange,
      position: Amount,
      fx_market: await this.fx_rate(Currency),
      fx_buy: ConversionRateOpen,
      date: util.time.ms(_date),
      price_market: this.price_decimal(p, CurrentPrice),
      price_buy: this.price_decimal(p, OpenPrice),
    };
  }

  private price_decimal(p: saxo_t.position_t, price: number) {
    let decimals = p.DisplayAndFormat.Decimals;
    return decimals ? price : price / 100;
  }
}
