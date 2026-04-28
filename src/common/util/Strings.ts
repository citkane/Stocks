export class Strings {
  title_case = (str: string) =>
    str
      ? str
          .toLowerCase()
          .split(" ")
          .map(function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ")
      : "";

  pad_hk_ticker = (ticker: string) => {
    return ticker.length < 5 ? ticker!.padStart(5, "0") : ticker;
  };
  unpad_hk_ticker = (ticker: string) => {
    return String(Number(ticker));
  };
  money = (value: number, curr: string) => {
    if (value === 0) return `${curr}0.00`;
    const neg = value < 0 ? "-" : "";
    value = Math.abs(value);
    const str = String(value);
    const len = str.length;
    let frac = str.substring(len - 2);
    if (frac.length === 1) frac = `0${frac}`;
    const whole = str.substring(len - 5, len - 2);
    const thou = str.substring(len - 8, len - 5);

    if (!whole) return `${neg}${curr}0.${frac}`;
    if (!thou) return `${neg}${curr}${whole}.${frac}`;
    return `${neg}${curr}${thou},${whole}.${frac}`;
  };
  country = (code: string) => {
    return code.toUpperCase().replace("GB", "UK");
  };
  clean_unicode = (text: string) => {
    return text.replace(/ /g, " ").replace(/[‬,‪]/g, "").replace(/−/g, "-");
  };
  p_html = (text: string) => {
    const replacements = [
      ["Co.", "Co_"],
      ["Ltd.", "Ltd_"],
      ["Corp.", "Corp_"],
      ["Inc.", "Inc_"],
      [" etc.", " etc_"],
    ];
    replacements.forEach((r) => {
      text = text.replaceAll(r[0]!, r[1]!);
    });
    text = text
      .trim()
      .replace(/\.$/, "")
      .replace(/ ([A-Z])\.([A-Z])\./g, " $1_$2_")
      .split(". ")
      .map((line) => {
        line = line.trim();
        return `<p>${line}.</p>`;
      })
      .join("")
      .replace(/ ([A-Z])_([A-Z])_/g, " $1.$2.");
    replacements.forEach((r) => {
      text = text.replaceAll(r[1]!, r[0]!);
    });
    return text;
  };
}
