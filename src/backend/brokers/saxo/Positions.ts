import { Global } from "backend";

type pos_t = b.s.position_t;

const { client_key } = conf.saxo;

export class Positions extends Global {
  constructor() {
    super();
  }
  public update = (skip = 0, positions: pos_t[] = []): Promise<pos_t[]> => {
    const query = this.endpoints.positions(skip);
    return this.saxo.fetch<b.s.positions_t>(query).then((data) => {
      const count = data.Data.length;
      return count > 0
        ? this.update(skip + count, [...positions, ...data.Data])
        : [...positions, ...data.Data];
    });
  };
  public position = (id: string) =>
    this.saxo
      .fetch<Object>(this.endpoints.position(id))
      .then((data) => logger.json("SAXO position", data));

  private endpoints = {
    positions: (skip: number) => {
      const field_groups =
        "DisplayAndFormat,ExchangeInfo,PositionView,PositionBase,Costs";
      const params = [
        `ClientKey=${client_key}`,
        `$skip=${skip}`,
        `fieldGroups=${field_groups}`,
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
  constructor(private position: b.s.position_t) {
    super();
  }

  translate(): position_t {
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
      amount: Amount,
      fx_market: this.fx_rate(Currency),
      fx_traded: ConversionRateOpen,
      date: util.time.ms(_date),
      price_market: this.price_decimal(p, CurrentPrice),
      price_traded: this.price_decimal(p, OpenPrice),
    };
  }

  private price_decimal(p: b.s.position_t, price: number) {
    let decimals = p.DisplayAndFormat.Decimals;
    return decimals ? price : price / 100;
  }
}
