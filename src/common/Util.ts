export class util {
  static Title_Case(str: string) {
    !str &&
      console.error("Empty string given to Title_Case", new Error().stack);
    return str
      ? str
          .toLowerCase()
          .split(" ")
          .map(function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ")
      : "";
  }
  static aging_days(start_date: string) {
    const date = util.date_time(start_date);
    const now = util.date_time();
    return Math.floor((now - date) / (24 * 60 * 60 * 1000));
  }
  static date_time(date?: string) {
    return date ? new Date(date).getTime() : new Date().getTime();
  }

  static blank_resolver(): resolver_t {
    return { resolve: () => {}, reject: () => {} };
  }
}
