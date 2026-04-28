export class Html {
  public escape = (str: string, stringify?: boolean) => {
    str = str
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    return stringify === false ? str : JSON.stringify(str);
  };
  public unescape = (str: string, _noop?: boolean) => {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };
  public json_stringify = (data: Object) => {
    return JSON.stringify(this.escaped_json(data, this.escape));
  };
  public json_parse = <T = Object>(json: string) => {
    const data = JSON.parse(json);
    return this.escaped_json(data, this.unescape) as T;
  };

  private escaped_json = (
    data: Object | string | number,
    action: typeof this.escape | typeof this.unescape,
  ): any => {
    if (data === null) return undefined;
    if (Array.isArray(data)) {
      return data.map((val) => this.escaped_json(val, action));
    }
    if (typeof data === "object") {
      return Object.keys(data).reduce((c, key) => {
        const k = key as keyof typeof data;
        c[k] = this.escaped_json(data[k], action);
        return c;
      }, {});
    }
    if (!isNaN(Number(data))) return data;
    if (typeof data === "string") return action(data, false);
  };
}
