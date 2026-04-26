const tv_url = "https://www.tradingview.com/symbols";

export class Trading_View {
  constructor(html: string) {
    this.dom = this.to_doc_fragment(html);

    this.company_el = this.dom.querySelector(
      '[data-container-name="company-info-id"]',
    );
    this.widgets_el = this.dom.querySelector(
      '[data-qa-id="symbol-overview-page-section-content"] [class^="widgets-"]',
    );
    this.about_el = this.company_el?.querySelector(
      'div[class^="blockText-"], div[class*=" blockText-"]',
    );
    this.breadcrumb_els = this.dom.querySelectorAll(
      'nav[class^="breadcrumbsContainer"] li a',
    );
    this.earnings_els = this.widgets_el?.querySelectorAll(
      '[data-qa-id="latest-earnings-summary-content"] .block-ststB_hQ',
    );
    this.stats_els = this.widgets_el?.querySelectorAll(
      '[data-qa-id="key-stats-id-content"] .block-ststB_hQ',
    );
    this.employees_els = this.widgets_el?.querySelectorAll(
      '[data-qa-id="employees-section-content"] .block-ststB_hQ',
    );
    this.info_els = this.company_el?.querySelectorAll(".block-ststB_hQ");

    this.logo_url = this.dom
      .querySelector('img[class^="logo-"], img[class*=" logo-"]')
      ?.getAttribute("src")!;
    this.about_company = this.about_el?.querySelector(
      '[class^="content-"]',
    )?.textContent!;
    this.company_info = this.reduce.list(this.info_els);
    this.company_employees = this.reduce.list(this.employees_els);
    this.asset_class = this.breadcrumbs[2]?.split(" ")[0]!;
    this.earnings = this.reduce.list(this.earnings_els);
    this.key_stats = this.reduce.list(this.stats_els);
  }

  public logo_url: string;
  public about_company: string;
  public asset_class: string;
  public company_info?: f.tv_list_t;
  public company_employees?: f.tv_list_t;
  public earnings?: f.tv_list_t;
  public key_stats?: f.tv_list_t;

  public get asset_sector() {
    if (this.asset_class === "ETF") return "Funds";
    return this.breadcrumbs[3];
  }
  public get asset_industry() {
    if (this.asset_class === "ETF") return "Etf";
    return this.breadcrumbs[4];
  }

  //public static fetch = (url: string) => {
  //  return fetch(url, {}).then((res) => {
  //    if (!res.ok) logger.warn("Failed Trading View lookup:", res.status, url);
  //    return res.ok ? res.text() : "";
  //  });
  //};

  public static link = (instrmnt: instrmnt_t, endpoint = "") => {
    return `${tv_url}/${this.ticker(instrmnt)}/${endpoint}`;
  };

  public static to_svg_logo = (svg_string: string, size: number) => {
    svg_string = util.html.unescape(svg_string);

    const logo = new DOMParser().parseFromString(
      svg_string,
      "image/svg+xml",
    ).documentElement;
    logo.setAttribute("viewBox", "0 0 56 56");
    logo.setAttribute("width", String(size));
    logo.setAttribute("height", String(size));
    return logo;
  };

  private company_el: HTMLElement | null;
  private about_el?: HTMLElement | null;
  private widgets_el: HTMLElement | null;
  private breadcrumb_els: NodeListOf<Element>;
  private info_els?: NodeListOf<Element>;
  private earnings_els?: NodeListOf<Element>;
  private stats_els?: NodeListOf<Element>;
  private employees_els?: NodeListOf<Element>;

  private get breadcrumbs() {
    if (this._breadcrumbs) return this._breadcrumbs;
    return (this._breadcrumbs = [...(this.breadcrumb_els || [])].map((b) =>
      util.string.clean_unicode(b.textContent).trim(),
    ));
  }

  private reduce = {
    list: (list?: NodeListOf<Element>) => {
      if (!list) return;

      const list_group = [...list].reduce((c, el) => {
        const _heading = el.querySelector(".labelWrapper-ststB_hQ div");
        _heading?.querySelectorAll("div").forEach((e) => e.remove());
        const heading = _heading?.textContent;
        if (!heading) return c;

        const _value = el.querySelector(".value-ststB_hQ");
        const _values = _value?.querySelectorAll("*");
        _values?.forEach((v) => v.remove());

        const value = _value
          ? util.string.clean_unicode(_value.textContent).trim()
          : "";
        let values = [...(_values || [])]
          .map((v) =>
            util.string.clean_unicode(v.textContent).trim().split(" "),
          )
          .flat();

        values = [...value.split(" "), ...values].filter(
          (v) => v !== "" && v !== "—",
        );
        if (!values.length) return c;

        c[heading] = values;
        return c;
      }, {} as f.tv_list_t);

      if (!Object.keys(list_group).length) return;
      return list_group;
    },
  };

  private to_doc_fragment = (html: string) => {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content;
  };

  private static ticker = (instrmnt: instrmnt_t) => {
    let { ticker, exchange } = instrmnt;
    if (exchange === "HKEX") ticker = String(Number(ticker));

    return `${exchange}-${ticker}`;
  };

  private dom: DocumentFragment;
  private _breadcrumbs?: string[];
}

declare global {
  namespace f {
    type tv_list_t = { [key: string]: (string | undefined)[] };
  }
}
