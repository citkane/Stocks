const money_round = 100;
const fx_round = 1000000;

export class Money {
  public currency_minor: string[] = ["ZAC", "GBp", "GBX"];
  public patch_currency = (currency: string) => {
    currency = currency === "CNH" ? "CNY" : currency;
    currency = currency === "ZAR" ? "ZAC" : currency;
    return currency;
  };

  /**
   * Calculates unrealised Profit/Loss
   * @param transaction
   * @returns Unrealised P/L in base currency whole number
   */
  //public u_pl_base_whole = (transaction: fe.transctn) => {
  //  let { amount, price_traded, price_market, fx_traded, fx_market, currency } =
  //    transaction;
  //  if (!amount || !price_traded || !fx_market || !price_market || !fx_traded)
  //    return 0;
  //
  //  price_market = this.whole(price_market);
  //  price_traded = this.whole(price_traded);
  //  const price_diff = price_market - price_traded;
  //
  //  return this.base_whole(currency, amount, price_diff / 100, fx_market);
  //};
  //public percent_pl = (traded_value: number, market_value: number) => {
  //  if (!traded_value || !market_value) return 0;
  //  return ((market_value - traded_value) / traded_value) * 100;
  //};
  /**
   * Calculates fx Profit/Loss
   * @param transaction
   * @returns Fx P/L in base currency whole number
   */
  //public fx_pl_base_whole = (transaction: fe.transctn) => {
  //  const {
  //    amount,
  //    price_traded,
  //    price_market,
  //    fx_traded,
  //    fx_market,
  //    currency,
  //  } = transaction;
  //  if (!amount || !price_traded || !fx_market || !price_market || !fx_traded)
  //    return 0;
  //
  //  const traded_base_value = this.base_whole(
  //    currency,
  //    amount,
  //    price_traded,
  //    fx_traded,
  //  );
  //  const market_base_value = this.base_whole(
  //    currency,
  //    amount,
  //    price_traded,
  //    fx_market,
  //  );
  //
  //  return market_base_value - traded_base_value;
  //};
  /**
   * Convert money by exchange rate
   * @param amount
   * @param price
   * @param fx_rate
   * @returns Money value in whole number
   */
  //public base_whole = (
  //  currency: string,
  //  amount?: number,
  //  price?: number,
  //  fx_rate?: number,
  //) => {
  //  if (!amount || !price || !fx_rate) return 0;
  //  if (this.currency_minor.includes(currency)) price = price / 100;
  //  price = this.whole(price);
  //  fx_rate = this.round_fx(fx_rate);
  //  return Math.round(amount * price * fx_rate);
  //};
  /**
   * Money value in whole number
   * @param value
   * @returns
   */
  //public whole = (value: number) => {
  //  return Math.round(value * money_round);
  //};
  //public round_fx = (rate: number) => {
  //  return Math.round(rate * fx_round) / fx_round;
  //};
  //public div_est = (market_val_cents: number, yield_perc: number) => {
  //  return Math.round((yield_perc / 100) * market_val_cents);
  //};
}
